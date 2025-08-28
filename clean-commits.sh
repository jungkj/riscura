#!/bin/bash

# Script to clean Claude Code references from commit messages

echo "Cleaning commit messages..."

# Create a backup branch
git branch -f backup-landing-page-revamp

# Get the base commit (where we branched from main)
BASE_COMMIT=$(git merge-base main HEAD)

# Get all commits from base to HEAD
COMMITS=$(git rev-list --reverse $BASE_COMMIT..HEAD)

# Create a new branch from the base
git checkout -B landing-page-revamp-clean $BASE_COMMIT

# Cherry-pick each commit with cleaned message
for commit in $COMMITS; do
    # Get the original commit message
    MSG=$(git log --format=%B -n 1 $commit | sed '/🤖 Generated with \[Claude Code\]/d' | sed '/Co-Authored-By: Claude/d')
    
    # Cherry-pick the commit
    git cherry-pick $commit --no-commit
    
    # Commit with cleaned message
    git commit -m "$MSG" --allow-empty
done

echo "Commit messages cleaned successfully!"
echo "New branch created: landing-page-revamp-clean"
echo "Original branch backed up as: backup-landing-page-revamp"