import { tool } from 'ai';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';
import {
  callHomeAssistantService,
  type HomeAssistantTarget,
} from '@/lib/integrations/home-assistant';

const entityIdSchema = z.union([z.string().min(1), z.array(z.string().min(1))]);

const targetSchema: z.ZodType<HomeAssistantTarget | undefined> = z
  .object({
    entity_id: entityIdSchema.optional(),
    device_id: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
    area_id: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
  })
  .strict()
  .optional();

export const homeAssistant = tool({
  description:
    'Call Home Assistant services to control devices. Provide the domain (light, switch, climate, etc.), service (turn_on, turn_off, etc.), and the target entity or additional data required for the call.',
  inputSchema: z.object({
    domain: z
      .string()
      .min(1)
      .describe('Home Assistant domain such as light, switch, climate, cover, etc.'),
    service: z
      .string()
      .min(1)
      .describe('Service to invoke within the domain, for example turn_on, turn_off, set_temperature.'),
    entityId: entityIdSchema
      .optional()
      .describe('Fully qualified entity_id (e.g. light.living_room) or an array of entity_ids to target.'),
    target: targetSchema.describe(
      'Optional target block for the service call. Use when a service expects target with entity_id, device_id, or area_id.',
    ),
    data: z
      .record(z.any())
      .optional()
      .describe('Additional service data payload as required by the Home Assistant service.'),
  }),
  execute: async ({ domain, service, entityId, target, data }) => {
    try {
      const result = await callHomeAssistantService({
        domain,
        service,
        entityId,
        target,
        data,
      });

      return {
        success: true,
        result,
      };
    } catch (error) {
      if (error instanceof ChatSDKError) {
        const response: {
          success: false;
          error: string;
          code: string;
          details?: string;
        } = {
          success: false,
          error: error.message,
          code: `${error.type}:${error.surface}`,
        };

        if (error.cause) {
          response.details = error.cause;
        }

        return response;
      }

      return {
        success: false,
        error: 'Unexpected error while interacting with Home Assistant.',
      };
    }
  },
});
