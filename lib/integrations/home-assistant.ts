import { ChatSDKError } from '@/lib/errors';

type EntityId = string | string[];

export interface HomeAssistantTarget {
  entity_id?: EntityId;
  device_id?: string | string[];
  area_id?: string | string[];
}

export interface CallHomeAssistantServiceParams {
  domain: string;
  service: string;
  entityId?: EntityId;
  target?: HomeAssistantTarget;
  data?: Record<string, unknown>;
}

function getHomeAssistantConfig() {
  const baseUrl = process.env.HOME_ASSISTANT_URL;
  const token = process.env.HOME_ASSISTANT_TOKEN;

  if (!baseUrl || !token) {
    throw new ChatSDKError(
      'bad_request:api',
      'Home Assistant integration is not configured.',
    );
  }

  return {
    baseUrl,
    token,
  };
}

function normalizePath(path: string) {
  return path.replace(/\/+/g, '/');
}

export async function callHomeAssistantService({
  domain,
  service,
  entityId,
  target,
  data,
}: CallHomeAssistantServiceParams) {
  const { baseUrl, token } = getHomeAssistantConfig();
  const trimmedDomain = domain.trim();
  const trimmedService = service.trim();

  if (!trimmedDomain || !trimmedService) {
    throw new ChatSDKError(
      'bad_request:api',
      'Both domain and service are required to call Home Assistant.',
    );
  }

  const payload: Record<string, unknown> = {};

  if (typeof entityId !== 'undefined') {
    if (Array.isArray(entityId)) {
      const normalizedEntityIds = entityId
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (normalizedEntityIds.length > 0) {
        payload.entity_id = normalizedEntityIds;
      }
    } else {
      const normalizedEntityId = entityId.trim();

      if (normalizedEntityId) {
        payload.entity_id = normalizedEntityId;
      }
    }
  }

  if (target) {
    const normalizedTargetEntries = Object.entries(target)
      .map(([key, value]) => {
        if (value === undefined || value === null) {
          return null;
        }

        if (Array.isArray(value)) {
          const cleanedValues = value
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          if (cleanedValues.length === 0) {
            return null;
          }

          return [key, cleanedValues] as const;
        }

        if (typeof value === 'string') {
          const trimmedValue = value.trim();

          if (!trimmedValue) {
            return null;
          }

          return [key, trimmedValue] as const;
        }

        return [key, value] as const;
      })
      .filter((entry): entry is [string, unknown] => entry !== null);

    if (normalizedTargetEntries.length > 0) {
      payload.target = Object.fromEntries(normalizedTargetEntries);
    }
  }

  if (data && Object.keys(data).length > 0) {
    payload.data = data;
  }

  const url = new URL(
    normalizePath(`/api/services/${trimmedDomain}/${trimmedService}`),
    baseUrl,
  );

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new ChatSDKError(
      'offline:api',
      'Unable to reach the configured Home Assistant instance.',
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    const message = responseText
      ? `Home Assistant responded with ${response.status}: ${responseText}`
      : `Home Assistant responded with ${response.status}.`;

    throw new ChatSDKError('bad_request:api', message);
  }

  if (!responseText) {
    return null;
  }

  const isJson = response.headers
    .get('content-type')
    ?.toLowerCase()
    .includes('application/json');

  if (isJson) {
    try {
      return JSON.parse(responseText);
    } catch (error) {
      throw new ChatSDKError(
        'bad_request:api',
        'Failed to parse JSON response from Home Assistant.',
      );
    }
  }

  return responseText;
}

export async function getHomeAssistantState(entityId: string) {
  const { baseUrl, token } = getHomeAssistantConfig();
  const trimmedEntityId = entityId.trim();

  if (!trimmedEntityId) {
    throw new ChatSDKError(
      'bad_request:api',
      'An entity ID is required to read Home Assistant state.',
    );
  }

  const url = new URL(
    normalizePath(`/api/states/${encodeURIComponent(trimmedEntityId)}`),
    baseUrl,
  );

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    throw new ChatSDKError(
      'offline:api',
      'Unable to reach the configured Home Assistant instance.',
    );
  }

  if (response.status === 404) {
    throw new ChatSDKError(
      'not_found:api',
      `Entity ${trimmedEntityId} was not found in Home Assistant.`,
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    const message = responseText
      ? `Home Assistant responded with ${response.status}: ${responseText}`
      : `Home Assistant responded with ${response.status}.`;

    throw new ChatSDKError('bad_request:api', message);
  }

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:api',
      'Failed to parse JSON response from Home Assistant.',
    );
  }
}
