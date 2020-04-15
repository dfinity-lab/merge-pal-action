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

    // Bug fix
    //
    // `head` is a `:` separated pair, first entry should be the organisation,
    // followed by the branch name, not just the branch name.
    //
    // Note: 'dfinity-lab' is the value of event.organization.login and
    // event.repository.owner.login
    //
    // https://developer.github.com/v3/pulls/#list-pull-requests describes
    // the format as 'user:ref-name' or 'organization:ref-name', so
    // event.organization.login is probably the better value
    const prs = await Promise.all(
        branchNames.map((branch) =>
            client.pulls.list({
                ...context.repo,
                head: `dfinity-lab:${branch}`, // TODO: Make a config option or infer
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
