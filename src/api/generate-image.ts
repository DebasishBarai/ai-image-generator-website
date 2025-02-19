interface GenerateImageRequest {
  prompt: string;
}

interface GenerateImageResponse {
  statusCode: number;
  body: string;
}

export async function generateImage(prompt: string): Promise<any> {
  try {
    console.log('API Config:', {
      accountId: import.meta.env.CLOUDFLARE_ACCOUNT_ID ? 'Set' : 'Missing',
      apiToken: import.meta.env.CLOUDFLARE_API_TOKEN ? 'Set' : 'Missing'
    });

    console.log('Starting generateImage with prompt:', prompt);
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${import.meta.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      }
    );

    console.log('Cloudflare Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    const data = await response.json();
    console.log('Cloudflare Data:', JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      throw new Error(`Cloudflare API error: ${data.errors?.[0]?.message || response.statusText}`);
    }

    return data;
  } catch (error: unknown) {
    console.error('Detailed Generation Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function handleGenerateImageRequest(
  req: Request
): Promise<GenerateImageResponse> {
  console.log('Handling generate image request...');
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const body = await req.json();
    console.log('Received request body:', body);
    const { prompt } = body as GenerateImageRequest;
    const data = await generateImage(prompt);

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error: unknown) {
    console.error('Request handling error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage })
    };
  }
} 