import { SageMakerClient, CreateModelCommand, CreateEndpointConfigCommand, CreateEndpointCommand } from "@aws-sdk/client-sagemaker";
import { ECRClient, GetAuthorizationTokenCommand } from "@aws-sdk/client-ecr";

const sagemaker = new SageMakerClient({ region: process.env.AWS_REGION });
const ecr = new ECRClient({ region: process.env.AWS_REGION });

async function setupSageMaker() {
  try {
    // 1. Get ECR authorization token
    const authResponse = await ecr.send(new GetAuthorizationTokenCommand({}));
    console.log('ECR Authorization successful');

    // 2. Create SageMaker Model
    const modelResponse = await sagemaker.send(new CreateModelCommand({
      ModelName: 'message-classifier',
      PrimaryContainer: {
        Image: `${process.env.AWS_ACCOUNT_ID}.dkr.ecr.${process.env.AWS_REGION}.amazonaws.com/blazingtext:latest`,
        Mode: 'SingleModel',
        Environment: {
          SAGEMAKER_PROGRAM: 'blazingtext',
          SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/model',
          SAGEMAKER_CONTAINER_LOG_LEVEL: '20',
          SAGEMAKER_REGION: process.env.AWS_REGION
        }
      },
      ExecutionRoleArn: process.env.SAGEMAKER_ROLE_ARN
    }));
    console.log('Model created:', modelResponse.ModelArn);

    // 3. Create Endpoint Configuration
    const endpointConfigResponse = await sagemaker.send(new CreateEndpointConfigCommand({
      EndpointConfigName: 'message-classifier-config',
      ProductionVariants: [{
        InitialInstanceCount: 1,
        InstanceType: 'ml.t2.medium',
        ModelName: 'message-classifier',
        VariantName: 'AllTraffic'
      }]
    }));
    console.log('Endpoint configuration created:', endpointConfigResponse.EndpointConfigArn);

    // 4. Create Endpoint
    const endpointResponse = await sagemaker.send(new CreateEndpointCommand({
      EndpointName: 'message-classifier',
      EndpointConfigName: 'message-classifier-config'
    }));
    console.log('Endpoint created:', endpointResponse.EndpointArn);

  } catch (error) {
    console.error('Error setting up SageMaker:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupSageMaker()
    .then(() => console.log('SageMaker setup completed successfully'))
    .catch(error => {
      console.error('SageMaker setup failed:', error);
      process.exit(1);
    });
}

export { setupSageMaker }; 