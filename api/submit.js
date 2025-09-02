const { google } = require("googleapis");
const { auth } = require("google-auth-library");

// Handler utama untuk Vercel Serverless Function
module.exports = async (req, res) => {
  // Hanya izinkan metode POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests are allowed" });
  }

  try {
    const body = req.body;

    // Inisialisasi autentikasi ke Google Sheets
    const credentials = {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Ganti escape character
    };
    const client = auth.fromJSON(credentials);
    client.scopes = ["https://www.googleapis.com/auth/spreadsheets"];

    const sheets = google.sheets({ version: "v4", auth: client });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Data yang akan dimasukkan ke baris baru
    const timestamp = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });
    const newRow = [
      timestamp,
      body.nama || "N/A",
      body.kelas || "N/A",
      body.skor_pg || "0",
      body.total_pg_benar || "0",
      JSON.stringify(body.jawaban) || "{}",
    ];

    // Cek apakah header sudah ada
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A1:F1",
    });

    if (
      !headerResponse.data.values ||
      headerResponse.data.values.length === 0
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Sheet1!A1",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [
            [
              "Timestamp",
              "Nama",
              "Kelas",
              "Skor PG",
              "Total PG Benar",
              "Detail Jawaban Esai",
            ],
          ],
        },
      });
    }

    // Tambahkan baris baru dengan jawaban siswa
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [newRow],
      },
    });

    // Kirim respons sukses
    res
      .status(200)
      .json({ result: "success", data: "Jawaban berhasil disimpan." });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      result: "error",
      message: "Terjadi kesalahan di server.",
      error: error.message,
    });
  }
};
