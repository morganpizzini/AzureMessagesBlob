$(function() {
  // blob rest API endpoint
  var blobUri = 'https://azureverona.blob.core.windows.net/';
  // container name
  var containerName = '$web';
  // directory name
  var directoryName = 'images/';
  // shared access signature token
  var sasToken =
    '?sv=2018-03-28&ss=bfqt&srt=sco&sp=rwdlacup&se=2019-05-07T22:28:38Z&st=2019-04-21T14:28:38Z&spr=https&sig=A5lQUmYFfv%2FATQRgdQcTAzik9qLhRxLcnjOMqXl2R%2Bc%3D';
  // blob storage
  var blobService = AzureStorage.Blob.createBlobServiceWithSas(blobUri, sasToken);

  // list images
  var listBlobs = () => {
    // null for currentToken
    // callback opts
    blobService.listBlobsSegmentedWithPrefix(containerName, directoryName, null, null, function(
      error,
      results
    ) {
      if (error) {
        console.log('Failed to list objects');
      } else {
        var websiteUrl = 'https://azureverona.z6.web.core.windows.net/';
        var listResult = '';
        for (var i = 0, blob; (blob = results.entries[i]); i++) {
          listResult += `<div class="col-md-4" id="image${i}">
          <div class="card mb-4 box-shadow">
            <img class="card-img-top placeholder" alt="Img01" src="${blobUri}${containerName}/${
            blob.name
          }${sasToken}"></img>
            <div class="card-body">
              <div class="card-text">Img01</div>
              <div class="justify-content-between align-items-center">
                <div class="btn-group">
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal" data-src="${websiteUrl}${
            blob.name
          }">View</button>
            <button type="button" class="btn btn-secondary delete_button" data-src="${
              blob.name
            }">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
          loadMeta(blob.name, i);
        }
        $('#images').html(listResult);
      }
    });
  };

  listBlobs();

  // load metadata
  function loadMeta(name, position) {
    blobService.getBlobMetadata(containerName, name, null, function(error, result) {
      console.log('blobMetadataResult for ' + position, result);
      if (result.metadata.caption) {
        $('#image' + position + ' .card-text').text(result.metadata.caption);
      }
    });
  }

  //upload image
  $('#uploadFile').on('change', function() {
    $('uploadResult').html('Uploading...');
    var file = $('#uploadFile').prop('files')[0];
    blobService.createBlockBlobFromBrowserFile(
      containerName,
      directoryName + file.name,
      file,
      function(error, result) {
        if (error) {
          alert(error);
        } else {
          $('#uploadResult').html('Done!');
          setTimeout(function() {
            $('#uploadResult').html('Upload a new file!');
            listBlobs();
          }, 2000);
        }
      }
    );
  });

  // delete image
  $(document).on('click', '.delete_button', function() {
    var options = {
      deleteSnapshots: AzureStorage.Blob.BlobUtilities.SnapshotDeleteOptions.BLOB_AND_SNAPSHOT
    };
    blobService.deleteBlob(containerName, $(this).attr('data-src'), options, function(
      error,
      result
    ) {
      if (error) {
        console.log('Failed to delete object', $(this).attr('data-src'));
      } else {
        alert('Successfully deleted the image');
        listBlobs();
      }
    });
  });

  // show modal
  $('#exampleModal').on('show.bs.modal', function(e) {
    var source = $(e.relatedTarget).attr('data-src');
    $('.img-responsive').attr('src', source);
  });
});
