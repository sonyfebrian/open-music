require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistService');
const PlaylistsValidator = require('./validator/playlists');


const playlistsong = require('./api/playlistsongs');
const PlaylistSongsService = require('./services/postgres/PlayListSongService');
const PlaylistsSongValidator = require('./validator/playlistsongs');

const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

const init = async () => {
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const playlistSongsService = new PlaylistSongsService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

await server.register([
  {
    plugin: Jwt,
  },
]);


server.auth.strategy('songsapp_jwt', 'jwt', {
  keys: process.env.ACCESS_TOKEN_KEY,
  verify: {
    aud: false,
    iss: false,
    sub: false,
    maxAgeSec: process.env.ACCESS_TOKEN_AGE,
  },
  validate: (artifacts) => ({
    isValid: true,
    credentials: {
      id: artifacts.decoded.payload.id,
    },
  }),
});

  await server.register([
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
            plugin: playlists,
            options: {
                playlistsService,
                validator: PlaylistsValidator,
            },
        },
        {
          plugin: playlistsong,
          options: {
            playlistSongsService,
            playlistsService,
            validator: PlaylistsSongValidator,
          },
        },
        {
          plugin: collaborations,
          options: {
            collaborationsService,
            playlistsService,
            validator: CollaborationsValidator,
          },
        },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
