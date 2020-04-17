import WebHooks = require('@octokit/webhooks')

import { Client, Context, Config } from './types'
import mergeIfReady from './mergeIfReady'

export default async function prHandler(
    client: Client,
    context: Context,
    config: Config,
) {
    const {
        repo: { repo, owner },
    } = context
    const pr = context.payload
        .pull_request as WebHooks.WebhookPayloadPullRequestPullRequest
    await mergeIfReady(client, owner, repo, pr, config)
}
