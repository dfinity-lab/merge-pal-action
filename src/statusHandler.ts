import { Client, Context, StatusPayload, Config } from './types'
import mergeIfReady from './mergeIfReady'

export default async function statusHandler(
    client: Client,
    context: Context,
    config: Config,
) {
    const event = context.payload as StatusPayload
    console.log('Status Payload:')
    console.log(event)
    const branchNames = event.branches.map((branch) => branch.name)
    console.log('Commit belongs to branches: ', branchNames)
    const prs = await Promise.all(
        branchNames.map((branch) =>
            client.pulls.list({
                ...context.repo,
                head: branch,
                state: 'open',
            }),
        ),
    )

    console.log('PRs before flattening')
    console.log(prs)

    const flatPRs = prs.flatMap((item) => {
        return item.data.map((pr) => pr)
    })

    console.log('PRs after flattening')
    console.log(flatPRs)

    await Promise.all(
        flatPRs.map((pr) =>
            mergeIfReady(
                client,
                context.repo.owner,
                context.repo.repo,
                pr.number,
                event.sha,
                config,
            ),
        ),
    )
}
