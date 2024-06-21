var refreshToken = "8QRVegvIqP4AAAAAAAAAAXM8id_GjRRQai9tLSALxxxH98aTuu6DY16nBOe1mVL0";
var base64authorization = btoa("0k4beryenn2qnob:9s01kw1dbz0xghn");
var accessToken;

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
        listFilesInDirectory(accessToken, "");
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
        displayFiles(data.entries, path);
    })
    .catch(error => {
        console.log('Error listing files in Dropbox:', error);
    });
}

function displayFiles(files, currentPath) {
    var fileList = $('#fileList');
    fileList.empty();

    if (files.length === 0) {
        fileList.append('<p>No files found in the directory.</p>');
    } else {
        var fileTable = $('<table border="1" cellpadding="5" cellspacing="0"></table>');
        fileTable.append(`<tr><th>Serial Number</th><th>${currentPath === '' ? 'Project Folder' : currentPath.split('/').pop()}</th><th>Type</th><th>Path</th></tr>`);

        files.sort((a, b) => {
            if (a['.tag'] === 'folder' && b['.tag'] === 'file') return -1;
            if (a['.tag'] === 'file' && b['.tag'] === 'folder') return 1;
            return 0;
        });

        files.forEach((file, index) => {
            var fileType = file['.tag'];
            var fileName = file.name;
            var filePath = file.path_display;

            var fileRow = $('<tr></tr>');
            fileRow.append(`<td>${index + 1}</td>`);
            fileRow.append(`<td>${fileName}</td>`);
            fileRow.append(`<td>${fileType}</td>`);
            fileRow.append(`<td>${filePath}</td>`);

            if (fileType === 'folder') {
                fileRow.css('cursor', 'pointer');
                fileRow.click(() => {
                    listFilesInDirectory(accessToken, filePath);
                });
            } else {
                fileRow.css('cursor', 'pointer');
                fileRow.click(() => {
                    downloadFile(accessToken, filePath, fileName);
                });
            }

            fileTable.append(fileRow);
        });

        var buttonContainer = $('<div></div>');
        if (currentPath !== "") {
            var backButton = $('<button>Back</button>');
            backButton.click(() => {
                var parentPath = currentPath.split('/').slice(0, -1).join('/');
                listFilesInDirectory(accessToken, parentPath);
            });
            buttonContainer.append(backButton);
        }

        var downloadAllButton = $('<button>Download All</button>');
        downloadAllButton.click(() => {
            downloadAllFiles(accessToken, currentPath);
        });
        buttonContainer.append(downloadAllButton);

        fileList.append(buttonContainer);
        fileList.append(fileTable);
    }
}

function downloadFile(accessToken, filePath, fileName) {
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
    })
    .catch(error => {
        console.log('Error downloading file from Dropbox:', error);
    });
}

function downloadAllFiles(accessToken, currentPath) {
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
    });
}


