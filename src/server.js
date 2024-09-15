import Hapi from '@hapi/hapi';
import { nanoid } from 'nanoid';

const books = []; // In-memory storage for books

// Fungsi untuk membaca data buku dari memori
const readBooksFromMemory = () => {
  return books;
};

// Fungsi untuk menulis data buku ke memori
const writeBookToMemory = (book) => {
  books.push(book);
};

// Fungsi untuk menghapus buku dari memori
const deleteBookFromMemory = (bookId) => {
  const index = books.findIndex(b => b.id === bookId);
  if (index !== -1) {
    books.splice(index, 1);
  }
};

const validateBook = (book) => {
  const { name, year, author, summary, publisher, pageCount, readPage, reading } = book;
  if (!name) return 'Gagal menambahkan buku. Mohon isi nama buku';
  if (typeof year !== 'number' || typeof pageCount !== 'number' || typeof readPage !== 'number') return 'Gagal menambahkan buku. Mohon isi year, pageCount, dan readPage dengan benar.';
  if (year < 0 || pageCount < 0 || readPage < 0) return 'Gagal menambahkan buku. year, pageCount, dan readPage tidak boleh negatif.';
  if (typeof reading !== 'boolean') return 'Gagal menambahkan buku. Mohon isi reading dengan benar (true/false).';
  return null;
};

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 9000,
    host: 'localhost'
  });

  // Route untuk menambahkan buku
  server.route({
    method: 'POST',
    path: '/books',
    handler: (request, h) => {
      const {
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        reading
      } = request.payload;

      // Validasi input
      const validationError = validateBook(request.payload);
      if (validationError) {
        return h.response({
          status: 'fail',
          message: validationError
        }).code(400);
      }

      // Validasi khusus untuk readPage dan pageCount
      if (readPage > pageCount) {
        return h.response({
          status: 'fail',
          message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount'
        }).code(400);
      }

      // Membuat ID unik untuk buku
      const id = nanoid();

      // Menghitung nilai finished
      const finished = pageCount === readPage;

      // Menyusun buku dengan struktur yang diinginkan
      const newBook = {
        id,
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        finished,
        reading,
        insertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Menyimpan buku ke memori
      writeBookToMemory(newBook);

      // Mengirimkan response
      return h.response({
        status: 'success',
        message: 'Buku berhasil ditambahkan',
        data: {
          bookId: id
        }
      }).code(201);
    }
  });

  // Route untuk menampilkan seluruh buku
  server.route({
    method: 'GET',
    path: '/books',
    handler: (_request, h) => {
      // Membaca data buku dari memori
      const books = readBooksFromMemory();

      // Menyaring data buku untuk menampilkan hanya id, name, dan publisher
      const simplifiedBooks = books.map(({ id, name, publisher }) => ({ id, name, publisher }));

      // Mengirimkan response dengan status 200 dan data buku
      return h.response({
        status: 'success',
        data: {
          books: simplifiedBooks
        }
      }).code(200);
    }
  });

  // Route untuk menampilkan detail buku berdasarkan ID
  server.route({
    method: 'GET',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params;

      // Membaca data buku dari memori
      const books = readBooksFromMemory();

      // Mencari buku berdasarkan ID
      const book = books.find(b => b.id === bookId);

      if (!book) {
        // Buku tidak ditemukan
        return h.response({
          status: 'fail',
          message: 'Buku tidak ditemukan'
        }).code(404);
      }

      // Buku ditemukan
      return h.response({
        status: 'success',
        data: {
          book
        }
      }).code(200);
    }
  });

  // Route untuk mengubah data buku berdasarkan ID
  server.route({
    method: 'PUT',
    path: '/books/{bookId}',
    handler: (request, h) => {
      const { bookId } = request.params;
      const {
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        reading
      } = request.payload;

      // Validasi input
      if (!name) {
        return h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. Mohon isi nama buku'
        }).code(400);
      }

      const validationError = validateBook(request.payload);
      if (validationError) {
        return h.response({
          status: 'fail',
          message: validationError
        }).code(400);
      }

      // Validasi khusus untuk readPage dan pageCount
      if (readPage > pageCount) {
        return h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount'
        }).code(400);
      }

      // Membaca data buku dari memori
      const books = readBooksFromMemory();

      // Mencari index buku berdasarkan ID
      const index = books.findIndex(b => b.id === bookId);

      if (index === -1) {
        // Buku tidak ditemukan
        return h.response({
          status: 'fail',
          message: 'Gagal memperbarui buku. Id tidak ditemukan'
        }).code(404);
      }

      // Menghitung nilai finished
      const finished = pageCount === readPage;

      // Menyusun data buku yang diperbarui
      const updatedBook = {
        ...books[index],
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        finished,
        reading,
        updatedAt: new Date().toISOString()
      };

      // Mengupdate buku di array
      books[index] = updatedBook;

      // Mengirimkan response
      return h.response({
        status: 'success',
        message: 'Buku berhasil diperbarui'
      }).code(200);
    }
  });

  // Route untuk menghapus buku berdasarkan ID
server.route({
  method: 'DELETE',
  path: '/books/{bookId}',
  handler: (request, h) => {
    const { bookId } = request.params;

    // Membaca data buku dari memori
    const books = readBooksFromMemory();

    // Mencari index buku berdasarkan ID
    const index = books.findIndex(b => b.id === bookId);

    if (index === -1) {
      // Buku tidak ditemukan
      return h.response({
        status: 'fail',
        message: 'Buku gagal dihapus. Id tidak ditemukan'
      }).code(404);
    }

    // Menghapus buku dari array jika ditemukan
    books.splice(index, 1);

    // Mengirimkan response sukses jika berhasil dihapus
    return h.response({
      status: 'success',
      message: 'Buku berhasil dihapus'
    }).code(200);
  }
});

  await server.start();
  console.log(`Server berjalan pada http://localhost:${server.info.port}`);
};

// Menangani error
process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();