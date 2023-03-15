const autoBind = require('auto-bind');
const config = require('../../utils/config');

class AlbumsHandler {
  constructor(albumsService, storageService, validator) {
    this._service = albumsService;
    this._storageService = storageService;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);

    const albumId = await this._service.addAlbum(request.payload);

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postCoverAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.verifyAlbum(id);

    const { cover } = request.payload;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);

    const coverUrl = `http://${config.app.host}:${config.app.port}/albums/cover/${filename}`;

    await this._service.editAlbumCoverById(id, coverUrl);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikeHandler(request, h) {
    const { id } = request.params;
    await this._service.verifyAlbum(id);

    const { id: owner } = request.auth.credentials;

    const result = await this._service.UserAlbumLikeUnlike(owner, id);

    let message = 'User menyukai album';

    if (result === 'unlike') {
      message = 'User batal menyukai album';
    }

    const response = h.response({
      status: 'success',
      message,
    });
    response.code(201);
    return response;
  }

  async getAlbumLikeHandler(request, h) {
    const { id } = request.params;
    await this._service.verifyAlbum(id);

    const result = await this._service.countUserAlbumLikes(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: result.likes,
      },
    });
    if (result.cache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }
}

module.exports = AlbumsHandler;
