export default function isEnabledForPR(
    label_names: string[],
    whitelist: string[],
    blacklist: string[],
) {
    if (whitelist.length === 0 && blacklist.length === 0) {
        console.log(
            'isEnabledForPR: whitelist and blacklist are both empty, returning true',
        )
        return true
    }

    console.log('isEnabledForPR: whitelist: ', whitelist)
    console.log('isEnabledForPR: blacklist: ', blacklist)

    console.log('isEnabledForPR: PR labels: ', label_names)

    const matchedBlack = label_names.filter((label) =>
        blacklist.includes(label),
    )
    const matchedWhite = label_names.filter((label) =>
        whitelist.includes(label),
    )

    console.log('isEnabledForPR: matchedBlack: ', matchedBlack)
    console.log('isEnabledForPR: matchedWhite: ', matchedWhite)

    if (blacklist.length > 0 && matchedBlack.length > 0) {
        console.log(
            'isEnabledForPR: Matched entry on blacklist, returning false',
        )
        return false
    }
    if (whitelist.length > 0 && matchedWhite.length === 0) {
        console.log(
            'isEnabledForPR: Did not match entry on whitelist, returning false',
        )
        return false
    }

    console.log(
        'isEnabledForPR: mergepal is enabled for this PR, returning true',
    )
    return true
}
