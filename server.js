const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const cheerio = require('cheerio');
const p = require('puppeteer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

require("dotenv").config();
// Use the stealth plugin
puppeteer.use(StealthPlugin());
// Enable CORS (optional, useful for local development)
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your domain if needed
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // If you are using preflight requests (OPTIONS method), end the request here
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // Send an empty response to OPTIONS requests
  }

  next(); // Continue to the next middleware or route handler
});
// Enable JSON parsing
app.use(express.json());
// async function fetchleetcodecontest(res, username, rating, title, liverank) {
//   let f = false;
//   let pg = 1;
//   for (pg = 1; pg <=60;) {
//     try {
//       const browser = await puppeteer.launch({  headless:true,
//         arg: [
//           "--disable--setuid-sandbox",
//           "--no-sandbox",
//           "--single-process",
//           "--no-zygote",
//         ], 
//         executablePath:
//           process.env.NODE_ENV === "production"
//             ? process.env.PUPPETEER_EXECUTABLE_PATH
//             : puppeteer.executablePath(),
//           });
//       const page = await browser.newPage();
//       await page.goto(`https://leetcode.com/contest/api/ranking/weekly-contest-420/?pagination=${pg}&region=global`, { timeout: 0 }, { waitUntil: 'networkidle0' });
//       const content = await page.content();
//       const temp = `${content}`;
//         console.log(temp);
       
//       let si = temp.indexOf('"total_rank"');

//       // // Find the ending index of 'user_num:29181'
//       let ei = temp.indexOf('"user_num":') + '"user_num":'.length + 6;
//       // // Extract the substring from start to end
//       let s = "{" + temp.substring(si, ei);
//       let data
//       try {
//         data = JSON.parse(s);
//         console.log("data");
//         pg++;
//       }
//       catch (err) {
//         console.error(err);
//       }
//       console.log("page no:", pg)
//       // // console.log(data);
//       await browser.close();
//       for (let i = 0; i < data.total_rank.length; i++) {
//         // console.log(`${data.total_rank[i].username}:${data.total_rank[i].rank}`);
//         if (data.total_rank[i].user_slug == username) {
//           liverank = data.total_rank[i].rank;
//           f = true;
//           break;
//         }
//       }
//     }
//     catch (err) {
//       console.log(`error parsing contest data pg:${pg}`, err)
//     }
//     if (f) {
//       break;
//     }

//   }
//   if (f || pg > 60) {
//     console.log(`username:${username}\n rating:${rating}\ntitle${title}\nlivee ranking:${liverank}`)
//     res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank: liverank } });
//   }
// }
app.post('/leetcode', async (req, res) => {
  try {
    console.log("Leetcode")
    const { username } = req.body
    // Make a request to LeetCode's GraphQL API
    const url = `https://leetcode.com/graphql?query=query
{     
      userContestRanking(username:  "${username}") 
      {
        attendedContestsCount
        rating
        badge {
        name
        }
      }
} `
    // console.log(url);
    let rating = 0, title = "None", liverank = '---'
    fetch(url, {
      method: 'GET', // HTTP method
    }).then((resp) => {
      resp.json().then(data => {
        const userRanking = data.data.userContestRanking;
        if (userRanking) {
          rating = Math.round(userRanking.rating);
          title = userRanking.badge ? userRanking.badge.name : 'None';
          // this url gives details of top two contest upcoming or running in leetcode
          // fetch("https://competeapi.vercel.app/contests/leetcode/").then((response) => {
          //   response.json().then((data) => {
          //     // if (data.data.topTwoContests.length) {
          //     //   let contest_slag = data.data.topTwoContests[0].title;
          //     //   const start_time = data.data.topTwoContests[0].startTime;
          //     //   const duration = data.data.topTwoContests[0].duration
          //     //   for (let i = 0; i < contest_slag.length; i++) {
          //     //     if (contest_slag[i] == ' ')
          //     //       contest_slag[i] = '-'
          //     //   }
          //     //   console.log("contest slag:", contest_slag);
          //     //   const curr_time = Math.floor(Date.now() / 1000);

          //     //   if(curr_time>=start_time&&curr_time<(start_time+duration)){
          //     //   fetchleetcodecontest(res, username, rating, title, liverank)
          //     //   }
          //     //   else{
          //     //   //   res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank: "no contest is running" } });
          //     //   }

          //     // }
          //     // else {
          //       res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank: "error fecthing contest details" } });
          //     // }


          //   }).catch((err) => {
          //     console.error("error parsing top two contest data", err);
          //   })
          // }).catch((err) => {
          //   console.error("error fetching top two contest data", err)
          //   res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank: "error fecthing contest details" } });
          // })
          // Output the values
          res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank:liverank} });
        } else {
          res.status(500).send(new Error("invalid username"));
        }
      }).catch(error => {
        res.status(500).send(new Error("error parsing data"));
        console.error('Error parsing JSON:', error);
      });
    });

  }
  catch (error) {
    console.log(error);
    res.status(500).send(new Error("invalid username"));
  }

});
app.post('/codeforces', async (req, res) => {
  console.log("arrived at server");
  console.log("codeforces")

  const { username } = req.body;
  const apiUrl = 'https://codeforces.com/api/contest.list';
  const url = `https://codeforces.com/api/user.info?handles=${username}`
  console.log(url);
  let rat
  let title = "None"
  let liverank = '---'

  fetch(url).then((resp) => {
    resp.json().then((data) => {
      if (data.status == 'OK') {
        const { rating, rank } = data.result[0];
        rat = rating;
        title = rank;
        console.log('Rating:', rat);
        console.log('title:', title);
        fetch(apiUrl).then((response) => {
          response.json().then((data) => {
            const ongoingContest = data.result.find(contest => (contest.phase === 'CODING') && (rating < 2000 ? (contest.name[contest.name.length - 2] != '1') : true));
            if (ongoingContest) {
              console.log("ongoing contest")
              fetch(`https://codeforces.com/api/contest.standings?contestId=${ongoingContest.id}&handles=${username}&from=1&count=1`).then((respn) => {
                respn.json().then((data) => {
                  // console.log(data.result.rows.length)
                  if (data.result.rows.length == 0) {
                    console.error("user not participated in current contest")
                    res.status(200).json({ message: 'Success', data: { rating: rat, title: title, rank: liverank } });
                  }
                  else {
                    // console.log(data.result.rows[0].rank)
                    liverank = data.result.rows[0].rank;
                    console.log(`username:${username}\n rating:${rating}\ntitle${title}\nlivee ranking:${liverank}`)
                    res.status(200).json({ message: 'Success', data: { rating: rat, title: title, rank: liverank } });
                  }
                }).catch((err) => {
                  console.error('Error parsing JSON userdata in ongoing contest:', err);
                });
              }).catch((err) => {
                console.error('error fetching ongoingcontest data:', err);
              });
            }
            else {
              res.status(200).json({ message: 'Success', data: { rating: rat, title: title, rank: liverank } });
              console.error('no ongoing contest')
            }

          }).catch((err) => {
            console.error('Error parsing JSON contest data', err);
          });
        }).catch((err) => {
          console.error('Error fetching contest data:', err);
        });
      }
      else {
        console.error('invalid username');
        res.status(500).send(new Error("Invalid username"));
      }
    }).catch((err) => {
      console.error('Error parsing JSON user data:', err);
    });
  }).catch((err) => {
    console.error('invalid username', err);
    res.status(500).send(new Error("Invalid username"));
  });

});

app.post('/codechef', async (req, res) => {
  try {
    console.log("codechef")
    const { username } = req.body;
    const url = `https://codechef-api.vercel.app/handle/${username}`;
    // console.log(url);
    let title = 'None'
    let rating = 0
    let liverank = '---'
    const resp = await fetch(url);
    resp.json().then(data => {
      if (data.success == false) {
        console.log("invalid username")
        res.status(500).send(new Error("invalid username"));
      }
      else {
        rating = data.currentRating;
        if (!rating) {
          rating = 0
        }
        else if (rating <= 1399) {
          title = '1*'
        }
        else if (rating <= 1599) {
          title = '2*'
        }
        else if (rating <= 1799) {
          title = '3*'
        }
        else if (rating <= 1999) {
          title = '4*'
        }
        else if (rating <= 2199) {
          title = '5*'
        }
        else if (rating <= 2499) {
          title = '6*'
        }
        else if (rating >= 2500) {
          title = '7*'
        }
        else {
          title = 'None'
        }
        // first fetch the code of an on going contest then on the bases of rating put D,C,B,A at the end of contest code and then pass it to fetch rank function
        fetch("https://competeapi.vercel.app/contests/codechef/").then((response) => {
          response.json().then((data) => {
            // console.log(data);
              if(data.present_contests.length>0){
            let contest_code=`${data.present_contests[0].contest_code}`;
            // let contest_code = `START157`;
            if (rating <= 1399) {
              contest_code += "D";
            }
            else if (rating <= 1599) {
              contest_code += "C";
            }
            else if (rating <= 1999) {
              contest_code += "B"
            }
            else {
              contest_code += "A"
            }
            fetchcodechefUserRank(username, contest_code).then((rank) => {
              if (rank) {
                liverank = rank;
              }
              console.log(`username:${username}\n rating:${rating}\ntitle${title}\nlivee ranking:${liverank}`)
              res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank: liverank } });
            }).catch((err) => {
              console.error('error fetching contest data', err)
              res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank: liverank } });
            })
              }
              else{
                console.log("no contest  is running")
                console.log(`username:${username}\nrating:${rating}\ntitle${title}\nlivee ranking:${liverank}`)
                res.status(200).json({ message: 'Success', data: { rating: rating, title: title, rank: liverank } });
              }
          })
        }).catch((err) => {
          console.error("error fetching contest data", err)
        })

      }
    }
    ).catch(error => {
      console.error('Error parsing JSON:', error);
    })

  }
  catch (error) {
    console.log(error);
    res.status(500).send(new Error("invalid username"));
  }

});
// the CodeChef contest ranking function
async function fetchcodechefUserRank(username, contest_code) {
  // Launch the browser
  const browser = await p.launch({
    headless:true,
    timeout: 60000, 
    arg: [
      "--disable--setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ], 
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  const page = await browser.newPage();

  // Navigate to the contest ranking page
  url = `https://www.codechef.com/rankings/${contest_code}?itemsPerPage=100&order=asc&page=1&search=${username}&sortBy=rank`;
  console.log(url);
  await page.goto(url, {
    waitUntil: 'networkidle2'
  });
  // Select the table row that contains the user's data
  const userData = await page.evaluate((username) => {
    // Find the row with the username 'littleorange'
    const userRow = Array.from(document.querySelectorAll('tr')).find((row) =>
      row.innerText.includes(username)
    );

    if (userRow) {
      // Extract rank, username, and country
      const rank = userRow.querySelector('td:nth-child(1)').innerText.trim();
      const username = userRow.querySelector('td:nth-child(2)').innerText.trim();
      const country = userRow.querySelector('td:nth-child(4)').innerText.trim(); // Adjust as necessary
      console.log(username, rank, country);
      return {
        username,
        rank,
        country
      };
    }

    return null;
  }, username);

  // await browser.close();

  if (userData) {
    // console.log(userData);
    // console.log(JSON.stringify(userData, null, 4));
    // const data=JSON.stringify(userData.rank);
    const rank = userData.rank;
    return rank;
  } else {
    console.log('User not participated in contest ');
    return null;
  }
}


// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
