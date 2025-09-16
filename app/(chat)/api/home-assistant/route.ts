import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import {
  callHomeAssistantService,
  getHomeAssistantState,
} from '@/lib/integrations/home-assistant';
import { z } from 'zod';

export const runtime = 'nodejs';

const entityIdSchema = z.union([z.string().min(1), z.array(z.string().min(1))]);

const targetSchema = z
  .object({
    entity_id: entityIdSchema.optional(),
    device_id: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
    area_id: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
  })
  .strict()
  .optional();

const callServiceSchema = z
  .object({
    domain: z.string().min(1),
    service: z.string().min(1),
    entityId: entityIdSchema.optional(),
    entity_id: entityIdSchema.optional(),
    target: targetSchema,
    data: z.record(z.any()).optional(),
  })
  .strict();

type CallServicePayload = z.infer<typeof callServiceSchema>;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  let body: CallServicePayload;

  try {
    const json = await request.json();
    body = callServiceSchema.parse(json);
  } catch (error) {
    return new ChatSDKError(
      'bad_request:api',
      "Invalid request body. Expected domain, service, and optional entity information.",
    ).toResponse();
  }

  const entityId = body.entityId ?? body.entity_id;

  try {
    const result = await callHomeAssistantService({
      domain: body.domain,
      service: body.service,
      entityId,
      target: body.target,
      data: body.data,
    });

    return Response.json(
      {
        success: true,
        result,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Error calling Home Assistant service:', error);
    return new ChatSDKError('offline:api').toResponse();
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get('entity_id') ?? searchParams.get('entityId');

  if (!entityId) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter entity_id is required to fetch an entity state.',
    ).toResponse();
  }

  try {
    const state = await getHomeAssistantState(entityId);

    return Response.json(
      {
        success: true,
        state,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Error fetching Home Assistant state:', error);
    return new ChatSDKError('offline:api').toResponse();
  }
}
