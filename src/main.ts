import prHandler from './prHandler'
import { Config, CoreModule, GitHubModule } from './types'
import statusHandler from './statusHandler'
import reviewHandler from './reviewHandler'
import pushHandler from './pushHandler'
import readConfig from './readConfig'
import repositoryDispatchHandler from './repositoryDispatchHandler'

export default async function main(core: CoreModule, github: GitHubModule) {
    const token = core.getInput('token')
    const client = new github.GitHub(token)
    let config: Config
    try {
        config = readConfig('.mergepal.yml')
    } catch (e) {
        core.setFailed(e.message)
        return
    }

    core.group('config:', async () =>
        core.info(JSON.stringify(config, undefined, 2)),
    )

    core.group('context:', async () =>
        core.info(JSON.stringify(github.context, undefined, 2)),
    )

    const event = github.context.eventName

    core.info(`eventName: ${event}`)

    let rateLimit = await client.rateLimit.get()
    core.info(
        `Rate limit: ${JSON.stringify(
            rateLimit.data.resources.core,
            undefined,
            2,
        )}`,
    )

    switch (event) {
        case 'pull_request':
            await core.group('prHandler()', () =>
                prHandler(client, github.context, config),
            )
            break
        case 'status':
            await core.group('statusHandler()', () =>
                statusHandler(client, github.context, config),
            )
            break
        case 'pull_request_review':
            await core.group('reviewHandler()', () =>
                reviewHandler(client, github.context, config),
            )
            break
        case 'push':
            await core.group('pushHandler()', () =>
                pushHandler(client, github.context, config),
            )
            break
        case 'repository_dispatch':
            await core.group('repositoryDispatchHandler()', () =>
                repositoryDispatchHandler(client, github.context, config),
            )
            break
        default:
            core.info(`Event ${event} is not handled, exiting`)
            break
    }
}
