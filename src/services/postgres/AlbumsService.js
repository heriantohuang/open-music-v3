const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums where id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = result.rows[0];

    const querySong = {
      text: 'SELECT id, title, performer FROM songs where "albumId" = $1',
      values: [album.id],
    };

    const resultSong = await this._pool.query(querySong);

    return {
      ...album,
      songs: resultSong.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums where id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async editAlbumCoverById(id, coverUrl) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async verifyAlbum(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async UserAlbumLikeUnlike(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 and album_id = $2 RETURNING id, \'unlike\' as status',
      values: [userId, albumId],
    };

    let result = await this._pool.query(query);

    if (!result.rowCount) {
      const id = `userlike-${nanoid(16)}`;

      const queryInsert = {
        text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id, \'like\' as status',
        values: [id, userId, albumId],
      };

      result = await this._pool.query(queryInsert);
      if (!result.rows[0].id) {
        throw new InvariantError('Album gagal ditambahkan');
      }
    }

    await this._cacheService.delete(`albumlikes:${albumId}`);
    return result.rows[0].status;
  }

  async countUserAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`albumlikes:${albumId}`);

      return {
        cache: true,
        ...JSON.parse(result),
      };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*)::int AS likes FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(`albumlikes:${albumId}`, JSON.stringify(result.rows[0]));

      return {
        cache: false,
        ...result.rows[0],
      };
    }
  }
}

module.exports = AlbumsService;
