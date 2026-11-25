const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, (err) => {
    if (err) {
        console.error('Server gagal berjalan:', err.message);
        process.exit(1);
    }
    console.log(`Server berjalan di port ${PORT}`);
});
