// 4re5 group C all right reserved

function fetchChapters() {
    // Fetch chapters from the server or local storage
    xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://raw.githubusercontent.com/d3m0n-project/d3m0n-project.github.io/refs/heads/main/academy.json', false); // Synchronous request for simplicity
    xhr.send();
    if (xhr.status === 200) {
        return JSON.parse(xhr.responseText);
    }
    else {
        console.error('Failed to fetch chapters:', xhr.statusText);
        return [];
    }
}

const chapters = fetchChapters();

var topbarHeight = document.querySelector('header').clientHeight;
var courseWindow = document.querySelector('.course-window');

function loadChapters() {
    document.querySelector('.course-window').style.top = topbarHeight + 'px';
    courseWindow.style.height = "calc(100vh - "+topbarHeight+"px)";

    document.getElementById('coursesList').innerHTML = ''; // clear the courses list

    // draw the chapters list
    let coursesList = document.getElementById('coursesList');
    chapters.forEach((chapter, index) => {
        // get the current challenge score from cookies
        currentChallenge = getCookie('ch' + (index + 1) + '_score');
        if (currentChallenge === "") {
            currentChallenge = 0; // Default to 0 if no cookie is set
            setCookie('ch' + (index + 1) + '_score', currentChallenge, 365); // Set cookie for 1 year
        } else {
            currentChallenge = parseInt(currentChallenge); // Convert cookie value to integer
        }
        maxChallenge = chapter.courses.length;

        // check if the chapter is completed
        if (currentChallenge >= maxChallenge) {
            // If the chapter is completed, set the class to 'completed'
            button = `<div class="subRightPanelDiv"><p>Completed</p> 
                <button onclick="clearScore('ch` + (index + 1) + `_score');" style="position: relative; text-align: center; float: right; color: white;" class="continue-button">Do it again</button>
            </div>`;
        } else {
            // If not completed, set the class to 'in-progress'
            button = `<button onclick="getInCourse('ch`+(index+1)+`_`+(currentChallenge)+`')" class="continue-button">Continue</button>`;
        }

        // Create chapter element
        coursesList.innerHTML += `
        <div id="courses" class="container">
            <div class="left-panel">
                <p style="text-transform: uppercase;">`+chapter.type+`</p>
                <h1>`+chapter.title+`</h1>
            </div>
            <div class="right-panel">
                <div class="subRightPanelDiv">
                    <div class="chapter-header">
                        <h2>CHAPTER `+(index+1)+`</h2> 
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div style="width: `+((currentChallenge/maxChallenge)*100)+`%;" class="progress"></div>
                            </div>
                            <p class="progress-text">`+(currentChallenge)+`/`+(maxChallenge)+` Challenges</p>
                        </div>
                    </div>
                    <p>`+chapter["description"]+`</p>
                </div>
                `+button+`
            </div>
        </div>`;
    });
}


function clearScore(name) {
    // clear the cookie for the chapter score
    setCookie(name, 0, 365);
    
    loadChapters(); // reload the chapters to update the UI
}

function codeHighlight(code, type = 'layout') {
    // Highlight code blocks
    var output = ``;
    code.split("\n").forEach(line => {
        if(type=='layout') { // layout code
                if(line.trim() === '') return; // empty lines
                
                else if(line.trim().startsWith('#')) // comments
                    output += `<p><span class="color-0">${line}</span></p>`;

                // controls name
                else if(line.trim().startsWith('Rect:') || line.trim().startsWith('Window:') || line.trim().startsWith('Hscroll:'))
                    output += `<p class="code-line"><span class="color-3">${line.trim()}</span></p>`;
                // properties
                else if(line.trim().includes('=')) {
                    const parts = line.split('=');
                    output += `<p class="property"><span class="color-2">${parts[0].trim()}</span><span>=</span><span class="color-1">${parts[1].trim().slice(0, -1)}</span>;</p>`;
                } else
                    output += `<p>${line}</p>`;
                console.log(line);
            
        } else if(type=='script') { // scripting code
            if(line.trim() === '') return; // empty lines
            
            else if(line.trim().startsWith('#')) // comments
                output += `<p><span class="color-0">${line}</span></p>`;
            
            // event definition
            else if(line.trim().includes('=>')) {
                output += `<p class="code-line"><span class="color-1">${line.trim()}</span></p>`;
            }
            // variable declaration
            else if(line.trim().startsWith('logn(') || line.trim().startsWith("console.") || line.trim().startsWith("system.") || line.trim().startsWith('print(') || line.trim().startsWith('sleep(') || line.trim().startsWith('app.') || line.trim().startsWith('alert(')) {
                const parts = line.split('(');
                output += `<p class="property"><span class="color-3">${parts[0].replaceAll("    ", "&#9;")}</span>(`;

                parts[1].split(',').forEach((part, index) => {
                    if (index === parts[1].split(',').length - 1) {
                        part = part.trim().slice(0, -2); // remove the 2 last character
                        output += `<span class="color-2">${part}</span>);`;
                    } else {
                        output += `<span class="color-2">${part}</span>, `;
                    }
                    
                });
                
                output += `</p>`;
            }
            // other code lines
            else {
                output += `<p>${line}</p>`;
            }
            // console.log(line);
            
        } else if(type=='manifest') { // manifest code
            if(line.trim() === '') return; // empty lines
            
            else if(line.trim().startsWith('#')) // comments
                output += `<p><span class="color-0">${line}</span></p>`;
            
            // key-value pairs
            else if(line.trim().includes(':')) {
                const parts = line.split(':');
                output += `<p class="code"><span class="color-2">${parts[0].trim()}</span><span>: </span><span class="color-1">${parts[1].trim()}</span></p>`;
            } else
                output += `<p>${line}</p>`;
        }
    });
    return output;
}

var totalQuizQuestions = 0;
var quizSolutions = []; // to store the quiz solution
var currentChapter = "ch0"; // to store the current progress of the chapter

function getInCourse(courseName) {
    // scroll to top of the page
    document.body.scrollTop = document.documentElement.scrollTop = 0;

    // clear the course activities and quiz containers
    document.getElementById('courseActivities').innerHTML = '';
    document.getElementById('courseQuiz').innerHTML = '';

    // set the course name in the course window
    courseWindow.style.transform = 'scale(1)';
    document.body.style.overflowY = 'hidden';

    const courseParts = courseName.substring(2).split('_');
    const chapterIndex = parseInt(courseParts[0]) - 1; // Convert to zero-based index
    const courseIndex = parseInt(courseParts[1]); // This is the current course index
    const chapter = chapters[chapterIndex];

    currentChapter = "ch" + (chapterIndex + 1); // update the current chapter

    // Set elements of the course in window
    document.getElementById("CurrentChapterName").innerText = chapter.title;
    document.getElementById("CurrentChapterTitle").innerText = chapter.courses[courseIndex].name;
    document.getElementById("CurrentChapterProgress").style.width = ((courseIndex) / chapter.courses.length) * 100 + '%';
    document.getElementById("CurrentChapterProgressText").innerText = (courseIndex) + '/' + chapter.courses.length + ' Challenges';
    document.getElementById("CurrentChapterDescription").innerText = chapter.courses[courseIndex].description;
    
    // fill the course activities
    const activitiesContainer = document.getElementById('courseActivities');
    const quizContainer = document.getElementById('courseQuiz');

    chapter.courses[courseIndex].activities.forEach(activity => {
        // console.log(activity);
        if(activity.type === 'text') {
            if(activity.title) {
                activitiesContainer.innerHTML += `
                <div class="activity">
                    <h2>${activity.title}</h2>
                    <p>${activity.value}</p>
                </div>`;
            } else {
                activitiesContainer.innerHTML += `
                <div class="activity" style="width: 100%;">
                    <p>${activity.value}</p>
                </div>`;
            }
        } else if(activity.type === 'image') {
            activitiesContainer.innerHTML += `
            <div class="activity" style="width: 100%;">
                <img src="${activity.src}" style="width: 100%;" alt="Activity Image" />
            </div>`;
        } else if(activity.type === 'code') {
            activitiesContainer.innerHTML += `
            <div class="code-editor">
                <div class="header">
                    <span class="title">${activity.code_type}</span>
                    <button onclick="copyToClipboard(this)" class="copy_toggle" tabindex="-1" type="button">
                        <svg width="16px" height="16px" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" stroke="currentColor" fill="none"><path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path></svg>
                    </button>
                </div>
                <div class="editor-content">
                    <code class="code">
                    ${codeHighlight(activity.value, activity.code_type)}
                    </code>
                </div>
            </div>`;
        } else if(activity.type === 'quiz') {
            var questions = '';
            activity.questions.forEach((question, qIndex) => {
                questions += `
                    <div class="quiz-question">
                        <p>${qIndex + 1}. ${question.question}</p>
                        <div class="quiz-options radio-input">
                            ${question.options.map((option, oIndex) => `
                                <label class="label"><input type="radio" id="value-q${qIndex}_${oIndex}" name="q${qIndex}" value="q${oIndex}"/><p class="text">${option}</p></label>
                            `).join('')}
                        </div>
                    </div>`;
            });

            // set the quiz questions and progress
            totalQuizQuestions = activity.questions.length;
            quizSolutions = activity.questions.map(q => q.answer); // store the correct answers

            quizContainer.innerHTML = `
            <div class="activity-card">
                    <h3>Quiz: Chapter ${chapterIndex+1}</h3>
                    <p>Test your knowledge on the fundamentals covered in Chapter ${chapterIndex+1}.</p>

                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress" id="quiz-progress"></div>
                        </div>
                        <p id="quiz-progress-text">0/${totalQuizQuestions} Questions</p>
                    </div>

                    <form id="quiz-form" onclick="updateQuizProgress()">
                        ${questions}
                        <button type="button" style="display:none;" id="quizSubmitBtn" class="btn" onclick="submitQuiz()">Submit Quiz</button>
                    </form>
                </div>`;
        } else if(activity.type === 'text-important') {
            activitiesContainer.innerHTML += `<div class="warningCard"><span><svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="m569.517 440.013c18.458 31.994-4.711 71.987-41.577 71.987h-479.886c-36.937 0-59.999-40.055-41.577-71.987l239.946-416.028c18.467-32.009 64.72-31.951 83.154 0zm-281.517-86.013c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346 7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"></path></svg>
            <p>${activity.value}</p></span></div>`;

            // <div class="activity-card">
            //     <h3>Exercise: Build a Layout</h3>
            //     <p>Apply what you've learned by building a basic layout.</p>
            //     <a href="#">Start Exercise</a>
            // </div>
        }
    });
}

function updateQuizProgress() {
    const inputs = document.getElementById('quiz-form').querySelectorAll('input[type="radio"]:checked');
    document.getElementById('quiz-progress').style.width = (inputs.length / totalQuizQuestions) * 100 + '%';
    document.getElementById('quiz-progress-text').textContent = inputs.length + '/' + totalQuizQuestions + ' Questions';

    if(inputs.length === totalQuizQuestions) {
        document.getElementById('quizSubmitBtn').style.display = 'block';
    } else {
        document.getElementById('quizSubmitBtn').style.display = 'none';
    }
}


function closeCourseWindow() {
    document.querySelector('.course-window').style.transform = 'scale(0)';
    document.body.style.overflowY = 'scroll';

    loadChapters();
}

function submitQuiz() {
    // Calculate the number of questions answered
    const inputs = document.getElementById('quiz-form').querySelectorAll('input[type="radio"]:checked');

    let i = 0;
    while(i < inputs.length) {
        console.log(inputs[i].value, quizSolutions[i]);
        if(quizSolutions[i] != inputs[i].value.substring(1)) {
            // if the answer is incorrect, show an alert and return
            alertMessage('Incorrect answer for question ' + (i + 1) + '. <br>Please try again.');
            return;
        }
        i++;
    }
    // update the progress
    var currentProgress = parseInt(getCookie(currentChapter + '_score'));
    setCookie(currentChapter + '_score', currentProgress + 1, 365); // set cookie for 1 year

    closeCourseWindow();
    confetti();
    
    
}

function alertMessage(message, type = 'error') {
    if(type === 'success') {
        document.body.innerHTML += `
        <div class="error">
            <div class="error__icon">
                <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path style="fill:#38ca0f" d="m13 13h-2v-6h2zm0 4h-2v-2h2zm-1-15c-1.3132 0-2.61358.25866-3.82683.7612-1.21326.50255-2.31565 1.23915-3.24424 2.16773-1.87536 1.87537-2.92893 4.41891-2.92893 7.07107 0 2.6522 1.05357 5.1957 2.92893 7.0711.92859.9286 2.03098 1.6651 3.24424 2.1677 1.21325.5025 2.51363.7612 3.82683.7612 2.6522 0 5.1957-1.0536 7.0711-2.9289 1.8753-1.8754 2.9289-4.4189 2.9289-7.0711 0-1.3132-.2587-2.61358-.7612-3.82683-.5026-1.21326-1.2391-2.31565-2.1677-3.24424-.9286-.92858-2.031-1.66518-3.2443-2.16773-1.2132-.50254-2.5136-.7612-3.8268-.7612z" fill="#38ca0f"></path></svg>
            </div>
            <div class="error__title" style="color:rgb(41, 145, 12)">${message}</div>
            <div class="error__close" onclick="document.querySelector('.error').remove();"><svg height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z" fill="#393a37"></path></svg></div>
        </div>`;
    } else if(type === 'error') {
        document.body.innerHTML += `
    <div class="error">
        <div class="error__icon">
            <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m13 13h-2v-6h2zm0 4h-2v-2h2zm-1-15c-1.3132 0-2.61358.25866-3.82683.7612-1.21326.50255-2.31565 1.23915-3.24424 2.16773-1.87536 1.87537-2.92893 4.41891-2.92893 7.07107 0 2.6522 1.05357 5.1957 2.92893 7.0711.92859.9286 2.03098 1.6651 3.24424 2.1677 1.21325.5025 2.51363.7612 3.82683.7612 2.6522 0 5.1957-1.0536 7.0711-2.9289 1.8753-1.8754 2.9289-4.4189 2.9289-7.0711 0-1.3132-.2587-2.61358-.7612-3.82683-.5026-1.21326-1.2391-2.31565-2.1677-3.24424-.9286-.92858-2.031-1.66518-3.2443-2.16773-1.2132-.50254-2.5136-.7612-3.8268-.7612z" fill="#393a37"></path></svg>
        </div>
        <div class="error__title">${message}</div>
        <div class="error__close" onclick="document.querySelector('.error').remove();"><svg height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z" fill="#393a37"></path></svg></div>
    </div>`;
    }
}
function copyToClipboard(button) {
        // Traverse up to the parent .code-editor div
        const codeEditor = button.closest('.code-editor');

        // Find the .editor-content .code div within the same .code-editor
        const codeTextElement = codeEditor.querySelector('.editor-content .code');

        // Extract the text content
        var codeText = codeTextElement.innerText;
        var topLine = codeText.split('\n')[0].trim();
        if(topLine.startsWith('# d3m0n')) {
            codeText = topLine + '\n' + codeText.replace(topLine+'\n', '').replaceAll("\n\n", "\n    ");
        } else {
            codeText = codeText.replaceAll("\n\n", "\n");
        }

        // fix the definitions padding
        codeText2 = codeText;
        codeText = "";
        codeText2.split('\n').forEach((line, index) => {
            if(line.trim().endsWith(';') || line.trim() == '' || line.trim().startsWith('#')) {
                codeText += line + '\n';
            }
            else if(line.startsWith(" ") && (line.includes("=>") || line.includes(':'))) {
                // if the line is a function definition, add padding
                codeText += '\n' + line.trim() + '\n';
            } else {
                // if the line is a property definition, add padding
                codeText += line + '\n';
            }
        });

        // Copy to clipboard
        navigator.clipboard.writeText(codeText).then(() => {
            alertMessage('Code copied to clipboard!', 'success');
        }).catch(err => {
            alertMessage('Failed to copy: '+err);
        });
    }
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
