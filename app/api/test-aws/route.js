import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    
    if (source === 'session') {
      const body = await request.json();
      const creds = JSON.parse(body.aws_creds);
      
      const client = new STSClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.sessionToken || undefined,  // Optional
        }
      });
      await client.send(new GetCallerIdentityCommand({}));
    } else {
      const client = new STSClient({ region: 'us-east-1' });
      await client.send(new GetCallerIdentityCommand({}));
    }
    
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}
