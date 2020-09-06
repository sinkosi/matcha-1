const sql = require("./db");

//Constructor
const Matches = function(match) {
    this.firstUserId = match.firstUserId;
    this.secondUserId = match.secondUserId;
    this.matchId = match.matchId;
}

Matches.add = (firstUserId, secondUserId, result) => {
    sql.query("INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)", [firstUserId, secondUserId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        console.log("Match added")
        result(null, res.insertId);
    });
};

Matches.findById = (matchId, result) => {
    sql.query("SELECT * FROM matches WHERE id = ?", [matchId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        console.log("Match found: ",  res);
        result(null, res[0]);
    });
};

Matches.findByUserId = (userId, result) => {
    let sqlQuery = `SELECT u.id, users.username FROM 
            (SELECT user1_id as id FROM matches as m WHERE m.user2_id = ?
                UNION
            SELECT user2_id as id FROM matches as n WHERE n.user1_id = ? ) as u LEFT JOIN users on users.id = u.id`
    sql.query(sqlQuery, [userId, userId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        result(null, res);
    });
};

Matches.removeOne = (matchId, result) => {
    sql.query("DELETE FROM matches WHERE id = ?", [matchId], (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, null);
            return;
        }
        console.log(`Match deleted`)
        result(null, res);
    });
}

module.exports = Matches;