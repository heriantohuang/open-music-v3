/* eslint-disable linebreak-style */
/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.addColumn('albums', {
    coverUrl: {
      type: 'TEXT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('albums', 'coverUrl');
};
