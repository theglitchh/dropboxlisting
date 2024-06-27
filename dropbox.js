var refreshToken = "Tm0H4MUNmU0AAAAAAAAAAWzCIp9Iy5VqHU2tqCX1GUQyQZid7AwbtDHOtbF00OwI";
var base64authorization = btoa("y47ekbwiky1wzip:w1lhejjroppukkl");
var accessToken;
var startingPath = ""; //Change Project Name here , eg., "/Accuracy Testing", "/Diabeties study"
var requestOptions = {
    method: 'POST',
    headers: {
        'Authorization': `Basic ${base64authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `refresh_token=${refreshToken}&grant_type=refresh_token`
};

fetch("https://api.dropbox.com/oauth2/token", requestOptions)
    .then(response => response.json())
    .then(data => {
        console.log('Response:', data);
        accessToken = data.access_token;
        listFilesInDirectory(accessToken, startingPath);
    })
    .catch(error => console.error('Error:', error));

function listFilesInDirectory(accessToken, path) {
    fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: path,
            recursive: false
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Files in directory:', data);
        displayFiles(data.entries, path); //passing data and path to displayFiles Function and calling it
    })
    .catch(error => {
        console.log('Error listing files in Dropbox:', error);
    });
}

function displayFiles(files, currentPath) {
    var fileList = $('#fileList');
    fileList.empty();

    if (files.length === 0) {
        // adding the back button here as well if the file list is empty i.e., no files inside of this directory in dropbox
        var buttonContainer = $('<div></div>').css({
            'display': 'flex',
            'justify-content': 'center',
            'margin-bottom': '10px',
            'gap': '5px'
        });
            var backButton = $('<center><button class="backbutton" style=" justify-content: center; gap: 10px;align-items: center; background-color: #2b5068; border: 0; border-radius: 100px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline-flex; font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 20px; max-width: 480px; min-height: 40px; min-width: 0px; overflow: hidden; padding: 0px; padding-left: 20px; padding-right: 20px; text-align: center; touch-action: manipulation; transition: background-color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, box-shadow 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s; user-select: none; -webkit-user-select: none; vertical-align: middle;">Back</button></center>');
            backButton.click(() => {
                var parentPath = currentPath.split('/').slice(0, -1).join('/');
                listFilesInDirectory(accessToken, parentPath);
            });
            buttonContainer.append(backButton);
        fileList.append('<center><p>No files found in the directory.</p></center>').append(backButton);
    } else {
        var fileTable = $('<table border="1" cellpadding="5" cellspacing="0"></table>').css({
            'margin': 'auto', // Center horizontally
            'text-align': 'left', // Ensure table content is left-aligned
            'align-items': 'center', // Center vertically
             'border-color': 'black' // Set border color to black
        });
        fileTable.append(`<tr align="center" style="background-color:#75bdbd;font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif;"><th>S.No</th><th>${currentPath === '' ? 'Project Folder' : currentPath.split('/').pop()}</th><th>Type</th><th>Open Folders</th></tr>`);

        files.sort((a, b) => { //using our own comparison-based sort algorithm here, basically sorts between folders and files and lists folders first then files in the current path
            if (a['.tag'] === 'folder' && b['.tag'] === 'file') return -1;
            if (a['.tag'] === 'file' && b['.tag'] === 'folder') return 1;
            return 0;
        });

        files.forEach((file, index) => {
            var fileType = file['.tag'];
            var fileName = file.name;
            var filePath = file.path_display;

            var fileRow = $('<tr></tr>').css('background-color', index % 2 === 0 ? 'white' : '#e0f0f0'); // Apply alternating background colors;
            fileRow.append(`<td style=" font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif;" align="center">${index + 1}</td>`);
            fileRow.append(`<td style=" font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif;">${fileName}</td>`);
            fileRow.append(`<td style=" font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif;" >${fileType}</td>`);

            var openFoldersCell = $('<td align="center"></td>'); // Creating a cell for the "Open Folders" button
            if (fileType === 'folder') {
                var openFoldersButton = $(`<button style="align-items: center; background-color: #2b5068; border: 0; border-radius: 100px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline; font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 20px; max-width: 100px; min-height: 30px; min-width: 80px; overflow: hidden; padding: 0px; padding-left: 20px; padding-right: 20px; text-align: center; touch-action: manipulation; transition: background-color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, box-shadow 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s; user-select: none; -webkit-user-select: none; vertical-align: middle;">Open</button>`);
                openFoldersButton.click(() => {
                    listFilesInDirectory(accessToken, filePath);
                });
                fileRow.append($('<td align="center"></td>').append(openFoldersButton));
               // openFoldersCell.append(openFoldersButton);
            }else {
                var downloadButton = $('<button>Download</button>').css({
                    'background-color': '#31b52c',
                    'border': '0',
                    'border-radius': '100px',
                    'color': '#ffffff',
                    'cursor': 'pointer',
                    'display': 'inline-flex',
                    'font-family': '-apple-system, system-ui, Helvetica, Arial, sans-serif',
                    'font-size': '16px',
                    'font-weight': '600',
                    'line-height': '20px',
                    'max-width': '480px',
                    'min-height': '31px',
                    'padding': '0px 20px',
                    'text-align': 'center',
                    'vertical-align': 'middle',
                    'align-items': 'center'
                });
                downloadButton.click(() => {
                    downloadFile(accessToken, filePath, fileName);
                });
                fileRow.append($('<td></td>').append(downloadButton));
            }
           // fileRow.append(openFoldersCell); 

            fileTable.append(fileRow);
        });

        var buttonContainer = $('<div></div>').css({
            'display': 'flex',
            'justify-content': 'center',
            'margin-bottom': '10px',
            'gap': '5px'
        });
        if (currentPath != startingPath) {
            var backButton = $('<button class="backbutton" style=" justify-content: center; gap: 10px;align-items: center; background-color: #2b5068; border: 0; border-radius: 100px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline-flex; font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 20px; max-width: 480px; min-height: 40px; min-width: 0px; overflow: hidden; padding: 0px; padding-left: 20px; padding-right: 20px; text-align: center; touch-action: manipulation; transition: background-color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, box-shadow 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s; user-select: none; -webkit-user-select: none; vertical-align: middle;">Back</button>');
            backButton.click(() => {
                var parentPath = currentPath.split('/').slice(0, -1).join('/');
                listFilesInDirectory(accessToken, parentPath);
            });
            buttonContainer.append(backButton);
        }

        var downloadAllButton = $(`<button class="DownloadALL" style="align-items: center; background-color: #31b52c; border: 0; border-radius: 100px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline-flex; font-family: -apple-system, system-ui, system-ui, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 20px; max-width: 480px; min-height: 40px; min-width: 0px; overflow: hidden; padding: 0px; padding-left: 20px; padding-right: 20px; text-align: center; touch-action: manipulation; transition: background-color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, box-shadow 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s, color 0.167s cubic-bezier(0.4, 0, 0.2, 1) 0s; user-select: none; -webkit-user-select: none; vertical-align: middle;">Download All</button>`);
        if (currentPath != "") {
            downloadAllButton.click(() => {
                downloadAllFiles(accessToken, currentPath);
            });
        } else {
            downloadAllButton.hide(); // Hide the button if currentPath is empty
        }
        buttonContainer.append(downloadAllButton);

        fileList.append(buttonContainer);
        fileList.append(fileTable);
    }
}



function downloadFile(accessToken, filePath, fileName) {
    showPopup("Downloading all files...");
    fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Dropbox-API-Arg': JSON.stringify({
                path: filePath
            })
        }
    })
    .then(response => response.blob())
    .then(blob => {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
         closePopup();
    })
    .catch(error => {
        console.log('Error downloading file from Dropbox:', error);
    });
}

// Function to show the popup
function showPopup(message) {
    var div = $('<div>' + message + '</div>');
    div.dialog({
        width: 500,
        height: 'auto',
        modal: true,
        closeOnEscape: false,
        resizable: false,
        draggable: false,
        title: "Please Wait",
         open: function(event, ui) {
            // Hide the close button
            $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
        }
    });
}

// Function to close the popup
function closePopup() {
    $('.ui-dialog').remove();
    $('.ui-widget-overlay').remove();
}

function downloadAllFiles(accessToken, currentPath) {
    // Show the popup when starting the download
    showPopup("Downloading all files...");

    fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: currentPath,
            recursive: true // Set recursive to true to include files and subfolders recursively
        })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.entries || data.entries.length === 0) {
            throw new Error('No files found to download.');
        }

        var zip = new JSZip();
        var filePromises = [];
        var maxConcurrentDownloads = 5; // Adjust the maximum concurrent downloads as needed

        // Function to download a single file and add it to the zip
        function downloadAndAddFile(entry) {
            return fetch('https://content.dropboxapi.com/2/files/download', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: entry.path_display
                    })
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${entry.path_display}`);
                }
                return response.blob().then(blob => {
                    zip.file(entry.path_display.substring(1), blob);
                });
            });
        }

        // Queue up file download promises with throttling
        data.entries.forEach(entry => {
            if (entry['.tag'] === 'file') {
                filePromises.push(() => downloadAndAddFile(entry));
            }
        });

        // Execute promises with throttling
        function executePromisesWithThrottle(promises) {
            return promises.reduce((promiseChain, currentTask) => {
                return promiseChain.then(chainResults =>
                    currentTask().then(currentResult =>
                        [...chainResults, currentResult]
                    )
                );
            }, Promise.resolve([]));
        }

        var chunkedPromises = [];
        for (var i = 0; i < filePromises.length; i += maxConcurrentDownloads) {
            chunkedPromises.push(filePromises.slice(i, i + maxConcurrentDownloads));
        }

        var finalPromise = chunkedPromises.reduce((promiseChain, chunk) => {
            return promiseChain.then(() => executePromisesWithThrottle(chunk));
        }, Promise.resolve());

        finalPromise.then(() => {
            zip.generateAsync({ type: 'blob' }).then(content => {
                closePopup(); // Close the popup when the download starts
                var url = window.URL.createObjectURL(content);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'all_files.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            });
        });
    })
    .catch(error => {
        console.log('Error downloading all files from Dropbox:', error);
        closePopup(); // Close the popup in case of an error
    });
}





