# Merge Pal

This action will help your prs to get merged!

# Contents

- [Features](#features)
- [Usage](#usage)
  - [Note about tokens](#note-about-tokens)
  - [Quick start](#quick-start)
  - [Configuration](#configuration)

# Features

- relises on mergability rules defined in your repository
- automatically updates your PR to be up to date with base branch
- supports white and black lists through labels
- supports various types of merge: normal, squash and rebase
- integrates seamlessly into GitHub Actions workflows as well as other 3rdparty checks

# Usage

## Note about tokens

Due to existing restriction workflows can not trigger each other if they are 
authorized with `secrets.GITHUB_TOKEN`. For instance if you are using workflows that runs when code is pushed to master it will not be triggered if `secrets.GITHUB_TOKEN` is used to authorize Merge Pal. In such a scenarion you have to create [personal access token](https://github.com/settings/tokens) and use it instead.

```yml
  - uses: maxkomarychev/merge-pal-action@vX.Y.Z
    with:
      token: ${{ secrets.MY_USER_TOKEN }}
```

## Quick Start

1. Specify desired mergeability rules in branch settings in your repository

2. Create workflow to handle various events that affect mergeability of PR (`.github/workflows/merge-pal-events.yml`):

    ```yml
    name: Merge Pal (events)

    on:
      push: {} # update PR when base branch is updated
      status: {} # try to merge when other checks are completed
      pull_request_review: # try to merge after review
        types:
          - submitted
          - edited
          - dismissed
      pull_request: # try to merge if labels have changed (white/black list)
        types:
          - labeled
          - unlabeled

    jobs:
      # thats's all. single step is needed - if PR is mergeable according to
      # branch protection rules it will be merged automatically
      mergepal:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v1
          - uses: maxkomarychev/merge-pal-action@vX.Y.Z
            with:
              token: ${{ secrets.GITHUB_TOKEN }}

    ```

3. Add Merge Pal to the end of your existing check (if any) with GitHub Actions


    ```yml
    name: Merge Pal (PR)

    on:
      pull_request:
        types:
          - synchronize
          - opened

    jobs:
      test-this: # test one things
        runs-on: ubuntu-latest
        steps:
          - run: echo "All ok"
      test-that: # test other things
        runs-on: ubuntu-latest
        steps:
          - run: echo "All ok"
      mergepal-merge: # run merge pal in the end
        runs-on: ubuntu-latest
        needs:
          # make sure all required jobs are listed here
          - test1-this
          - test1-that
        steps:
          - uses: actions/checkout@v1
          - uses: maxkomarychev/merge-pal-action@vX.Y.Z
            with:
              token: ${{ secrets.GITHUB_TOKEN }}

    ```


## Configuration

Various aspects of Merge Pal's behavior are configured thorugh configuration file.

Create file `.mergepal.yml` in root folder of your repo.
It can hold the following fields:

| field | type | description |
| --- | --- | --- |
| whitelist | string[] | whitelisted labels to perform automerge |
| blacklist | string[] | blacklisted labels to forbid automerge |
| method | "merge" \| "squash" \| "rebase" | method to use when merging |
| passing_status_checks | string[] | context names of status checks that must pass |

Merge Pal is normally run for every change to a status check. This can be a problem
if you have multiple status checks but only some of them need to pass for the PR to
be mergeable.

If `passing_status_checks` is empty then Merge Pal will fetch PR details on every
status check. If you have many status checks, or many open PRs then this can
exhaust your GitHub API quota.

If `passing_status_checks` is set then Merge Pal will only act on status changes
to those status checks, which can significantly reduce the API usage.

example:

```yml
whitelist:
  - good-to-merge
blacklist:
  - wip
  - do-not-merge
method: squash
passing_status_checks:
  - ci:all-jobs
```
