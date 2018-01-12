# league-rank-api

[Demo version](http://lr.cobaltium.net)

LeagueRank is a League of Legends leaderboard application that tracks users progress as they level up.

## Planned Features

- Custom leaderboards (user created)
- Better caching and cache invalidation
- Storing more kinds of data
- Periodic bulk user updates (background requests to the League API for extra matches)
- Filters (By level, by champion, by rank)

## Requirements

- `Node >= 7`
- yarn/npm
- PostgreSQL or another SQL implementation

## Usage

- First usage: `yarn db-setup`.
- `yarn start`
