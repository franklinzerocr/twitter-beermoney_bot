import mysql from 'promise-mysql';

export let db_config = {};

// Connect to the DB and get the Pool of it to perform querys
export function connection(database) {
  db_config = {
    host: database.Host,
    user: database.User,
    password: database.Password,
    database: database.DatabaseName,
    connectionLimit: 100,
  };

  return mysql.createPool(db_config);
}

export async function getNewlyCreatedFloors(dbConnection) {
  try {
    // 1min Delay
    let timeConditionEntry = '(UNIX_TIMESTAMP(CURRENT_TIME())-UNIX_TIMESTAMP(f.DateTime))/60 <1 AND (UNIX_TIMESTAMP(CURRENT_TIME())-UNIX_TIMESTAMP(f.DateTime))/60 >=0';
    let timeConditionEnd = '(UNIX_TIMESTAMP(CURRENT_TIME())-UNIX_TIMESTAMP(f.DateTime))/60 <1 AND (UNIX_TIMESTAMP(CURRENT_TIME())-UNIX_TIMESTAMP(f.DateTime))/60 >=0';

    let result = await dbConnection.query('SELECT * FROM floor f WHERE DateTime IS NOT NULL AND ((Level=0 AND ' + timeConditionEntry + ') OR (Level=-2 AND ' + timeConditionEnd + ' AND Profit<=10)) AND TweetID is Null AND OrderID>0 ');
    return result;
  } catch (e) {
    console.log(e);
    console.log('getNewlyCreatedFloor Error');
    return false;
  }
}

export async function updateTweetFloor(dbConnection, id, tweetID) {
  try {
    let result = await dbConnection.query('UPDATE floor SET TweetID=' + tweetID + '  WHERE ID=' + id);

    return result;
  } catch (e) {
    console.log(e);
    console.log('updateTweetFloor Error');
    return false;
  }
}

export async function getInitialFloor(dbConnection, tradingPlanID) {
  try {
    let result = await dbConnection.query('SELECT * FROM floor f WHERE Level=0 AND FK_Trading_Plan=' + tradingPlanID);

    return result[0];
  } catch (e) {
    console.log(e);
    console.log('getInitialFloor Error');
    return false;
  }
}
