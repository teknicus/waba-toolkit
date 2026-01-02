import { WABAApiClient } from '../../api/client.js';
import { getConfig, resolveWabaId, resolveAccessToken } from '../config-manager.js';
import { printJson, formatError, handleError } from '../utils.js';
import { WABASendError } from '../../errors.js';
import type { FlowCategory } from '../../api/types.js';

interface ListFlowsOptions {
  wabaId?: string;
}

/**
 * List all flows for a WhatsApp Business Account.
 */
export async function listFlows(options: ListFlowsOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const wabaId = resolveWabaId(options.wabaId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for flow operations
      apiVersion: config.apiVersion,
    });

    const response = await client.listFlows(wabaId);

    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Failed to list flows', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

interface CreateFlowOptions {
  name: string;
  categories?: string;
  endpointUri?: string;
  cloneFlowId?: string;
  wabaId?: string;
}

interface UpdateFlowOptions {
  flowId: string;
  file: string;
}

/**
 * Create a new WhatsApp Flow.
 */
export async function createFlow(options: CreateFlowOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const wabaId = resolveWabaId(options.wabaId);
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for flow operations
      apiVersion: config.apiVersion,
    });

    // Parse categories from comma-separated string
    let categories: FlowCategory[] | undefined;
    if (options.categories) {
      categories = options.categories.split(',').map((c) => c.trim()) as FlowCategory[];
    }

    const response = await client.createFlow(wabaId, {
      name: options.name,
      categories,
      endpointUri: options.endpointUri,
      cloneFlowId: options.cloneFlowId,
    });

    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Failed to create flow', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

/**
 * Update Flow JSON for an existing flow.
 */
export async function updateFlow(options: UpdateFlowOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for flow operations
      apiVersion: config.apiVersion,
    });

    const response = await client.updateFlowJson(options.flowId, options.file);

    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Failed to update flow', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}

interface PublishFlowOptions {
  flowId: string;
}

/**
 * Publish a flow. This action is irreversible.
 */
export async function publishFlow(options: PublishFlowOptions): Promise<void> {
  try {
    const accessToken = resolveAccessToken();
    const config = getConfig();

    const client = new WABAApiClient({
      accessToken,
      phoneNumberId: '', // Not needed for flow operations
      apiVersion: config.apiVersion,
    });

    const response = await client.publishFlow(options.flowId);

    printJson(response);
  } catch (error) {
    if (error instanceof WABASendError) {
      console.error(formatError('Failed to publish flow', error.errorPayload));
    } else {
      handleError(error);
    }
    process.exit(1);
  }
}
