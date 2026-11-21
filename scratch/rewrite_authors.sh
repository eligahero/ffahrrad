#!/bin/sh
export FILTER_BRANCH_SQUELCH_WARNING=1

git filter-branch -f --env-filter '
    export GIT_AUTHOR_NAME="eligahero"
    export GIT_AUTHOR_EMAIL="eligahero@gmail.com"
    export GIT_COMMITTER_NAME="eligahero"
    export GIT_COMMITTER_EMAIL="eligahero@gmail.com"
' --tag-name-filter cat -- main
