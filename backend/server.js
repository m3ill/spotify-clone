const pool = require("./db");
const express = require("express");
const argon2 = require("argon2");
const session = require("express-session");
const cors = require("cors");

const app = express();


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000*60*60 } 
}));

app.get("/health", (req,res) => {
    res.json({status: 200});
});

app.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT id,username,display_name,bio FROM users ORDER BY id ASC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/users/:id", async (req, res) => {
    const userId = Number(req.params.id);
    if(!Number.isInteger(userId)||userId <= 0) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const result = await pool.query("SELECT id,username,display_name,bio FROM users WHERE id = $1", [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/auth/register", async (req, res) => {
    const { username, display_name, bio = "" ,email,password} = req.body;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (typeof username !== "string"||typeof display_name !== "string"||
        typeof bio !== "string"||typeof email !== "string"||typeof password !== "string"||username.trim() === "" || display_name.trim() === ""|| !emailPattern.test(email.trim()) ||
        password.length < 15 || password.length > 128||username.trim().length > 50 || display_name.trim().length > 100 || bio.trim().length > 500|| email.trim().length > 254) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const hashedPassword = await argon2.hash(password);
        const result = await pool.query("INSERT INTO users (username,display_name,bio,email,password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id,username,display_name,bio,email", [username.trim(), display_name.trim(), bio.trim(), email.trim(), hashedPassword]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if(error.code === "23505") {
            if (error.constraint === "users_username_key") {
            res.status(409).json({ error: "Username already exists" });
            } else if (error.constraint === "users_email_key") {
            res.status(409).json({ error: "Email already exists" });
            }else{
            res.status(500).json({ error: "Internal Server Error" });
            }
        }
        else {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if(typeof email !== "string" || typeof password !== "string" || email.trim() === "" || password === "") {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try{
        const result = await pool.query("SELECT id, username, display_name, password_hash FROM users WHERE email = $1", [email.trim()]);
        if(result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        
        const user = result.rows[0];
        if(!user.password_hash) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const isValidPassword = await argon2.verify(user.password_hash, password);
        if(!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        req.session.regenerate((err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            req.session.userId = user.id;
            res.status(200).json({ id : user.id, username: user.username, display_name : user.display_name }); 

        })

    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/me", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try{
        const result = await pool.query("SELECT id,username,display_name,bio FROM users WHERE id = $1", [userId]);

        if(result.rows.length === 0) {
            return res.status(401).json({ error: "User not found" });
        }
        const user = result.rows[0];
        return res.status(200).json({ id: user.id, username: user.username, display_name: user.display_name, bio: user.bio });

    }catch(error){
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.clearCookie("connect.sid");
        res.status(204).end();
    });

});

app.post("/playlists", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const name = req.body.name;
    if (typeof name !== "string" || name.trim() === "" || name.trim().length > 60) {
        return res.status(400).json({ error: "Invalid playlist name" });
    }
    
    try {
        const result = await pool.query("INSERT INTO playlists (user_id, name) VALUES ($1, $2) RETURNING id, name", [userId, name.trim()]);
        res.status(201).json(result.rows[0]);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/playlists", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const result = await pool.query("SELECT id, name FROM playlists WHERE user_id = $1 ORDER BY id ASC", [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.patch("/playlists/:id", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const playlistId = Number(req.params.id);
    if (!Number.isInteger(playlistId) || playlistId <= 0) {
        return res.status(400).json({ error: "Invalid playlist ID" });
    }
    const name = req.body.name;
    if (typeof name !== "string" || name.trim() === "" || name.trim().length > 60) {
        return res.status(400).json({ error: "Invalid playlist name" });
    }
    
    try {
        const result = await pool.query("UPDATE playlists SET name = $1 WHERE id = $2 and user_id = $3 RETURNING id, name", [name.trim(), playlistId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        res.status(200).json(result.rows[0]);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.delete("/playlists/:id", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    const playlistId = Number(req.params.id);
    if (!Number.isInteger(playlistId) || playlistId <= 0) {
        return res.status(400).json({ error: "Invalid playlist ID" });
    }
    
    try {
        const result = await pool.query("DELETE FROM playlists WHERE id = $1 and user_id = $2 RETURNING id", [playlistId, userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Playlist not found" });
        }
        res.status(204).end();
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/songs", async (req, res) => {
    try {
        const result = await pool.query("SELECT id,title,duration_seconds FROM songs ORDER BY id ASC");
        
        res.status(200).json(result.rows);

    }catch(error){
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/songs/:id", async (req, res) => {
    const songId = Number(req.params.id);
    if (!Number.isInteger(songId) || songId <= 0) {
        return res.status(400).json({ error: "Invalid song ID" });
    }
    try{
        const result = await pool.query("SELECT id,title,duration_seconds FROM songs WHERE id = $1", [songId]);
        if(result.rows.length === 0) {
            return res.status(404).json({ error: "Song not found" });
        }
        res.status(200).json(result.rows[0]);
    }catch(error){
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }    
});

app.post("/songs", async (req, res) => {

    const {title, duration_seconds} = req.body ?? {};
    if (typeof title !== "string" || title.trim() === "" || title.trim().length > 200) {
        return res.status(400).json({ error: "Invalid song title" });
    }
    if (!Number.isInteger(duration_seconds) || duration_seconds <= 0 || duration_seconds > 2147483647) {
        return res.status(400).json({ error: "Invalid song duration" });
    }

    try {
        const result = await pool.query("INSERT INTO songs (title, duration_seconds) VALUES ($1, $2) RETURNING id, title, duration_seconds", [title.trim(), duration_seconds]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.patch("/songs/:id", async (req, res) => {
    const songId = Number(req.params.id);
    if (!Number.isInteger(songId) || songId <= 0) {
        return res.status(400).json({ error: "Invalid song ID" });
    }

    const {title, duration_seconds} = req.body ?? {};
    if(title === undefined  && duration_seconds === undefined) {
        return res.status(400).json({error: "At least one field is required"});
    }
    if(title !== undefined && (typeof title !== "string" || title.trim() === "" || title.trim().length > 200)) {
        return res.status(400).json({ error: "Invalid song title" });
    }
    if(duration_seconds !== undefined && (!Number.isInteger(duration_seconds) || duration_seconds <= 0 || duration_seconds > 2147483647)) {
        return res.status(400).json({ error: "Invalid song duration" });
    }
    
    try {
        const result = await pool.query("UPDATE songs SET title = COALESCE($1, title), duration_seconds = COALESCE($2, duration_seconds) WHERE id = $3 RETURNING id, title, duration_seconds", [title?.trim(), duration_seconds, songId]);
        
        if(result.rows[0] === undefined) {
            return res.status(404).json({ error: "Song not found" });
        }
        return res.status(200).json(result.rows[0]);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }    
});

app.get("/playlists/:id/songs", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const playlistId = Number(req.params.id);
    if (!Number.isInteger(playlistId) || playlistId <= 0 || playlistId > 2147483647) {
        return res.status(400).json({ error: "Invalid playlist ID" });
    }

    try {
        const playlist = await pool.query(
            "SELECT id FROM playlists WHERE id = $1 AND user_id = $2",
            [playlistId, userId]
        );

        if (playlist.rows.length === 0) {
            return res.status(404).json({ error: "Playlist not found" });
        }

        const result = await pool.query(
            `SELECT s.id, s.title, s.duration_seconds
            FROM songs s
            JOIN playlist_songs ps ON s.id = ps.song_id
            WHERE ps.playlist_id = $1
            ORDER BY s.id ASC`,
            [playlistId]
        ); 
        return res.status(200).json(result.rows);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/playlists/:id/songs", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const playlistId = Number(req.params.id);
    if (!Number.isInteger(playlistId) || playlistId <= 0 || playlistId > 2147483647) {
        return res.status(400).json({ error: "Invalid playlist ID" });
    }
    const { songId } = req.body ?? {};
    if (!Number.isInteger(songId) || songId <= 0 || songId > 2147483647) {
        return res.status(400).json({ error: "Invalid song ID" });
    }

    try{
        const playlist = await pool.query(
            "SELECT id FROM playlists WHERE id = $1 AND user_id = $2",
            [playlistId, userId]
        );
        
        if (playlist.rows.length === 0) {
            return res.status(404).json({ error: "Playlist not found" });
        }

        const song = await pool.query("INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2)ON CONFLICT (playlist_id, song_id) DO NOTHING RETURNING playlist_id, song_id", [playlistId, songId]);
        if (song.rows.length === 0) {
            return res.status(409).json({ error: "Song already in playlist" });
        }
        return res.status(201).json(song.rows[0]);
    }catch (error) {
        if (error.code === "23503") {

            if (error.constraint === "playlist_songs_song_id_fkey") {
                return res.status(404).json({ error: "Song not found" });
            }
        }
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
