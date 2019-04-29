#r "Microsoft.Azure.EventGrid"
#r "Newtonsoft.Json"
#r "Microsoft.WindowsAzure.Storage"

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Text;
using Microsoft.Azure.EventGrid.Models;
using Microsoft.WindowsAzure.Storage.Blob;

public static async Task Run(EventGridEvent eventGridEvent, ILogger log)
{
    log.LogInformation(eventGridEvent.Data.ToString());
    // image path
    string containerSas = System.Environment.GetEnvironmentVariable("container_sas");
    // string fullObjPath = (string)eventGridEvent.Data.FileUrl + containerSas;

    JObject parsedData = JObject.Parse(JsonConvert.SerializeObject(eventGridEvent.Data));
    string fullObjPath = (string)parsedData["url"] + containerSas;
    log.LogInformation(fullObjPath);
    // call AI services
    string AIResult = await MakeAnalysisRequest(fullObjPath,log);
    // get caption
    string caption =JObject.Parse(AIResult)["description"]["captions"][0]["text"].ToString();

    log.LogInformation(caption.ToString());

    // set metadata
    CloudBlockBlob myImage = new CloudBlockBlob(new Uri(fullObjPath));
        log.LogInformation(myImage.ToString());

    //load image attributes
    await myImage.FetchAttributesAsync();
    if(!myImage.Metadata.ContainsKey("caption")){
        myImage.Metadata.Add("caption",caption);
        await myImage.SetMetadataAsync();
        log.LogInformation("metadata updated");
    }
}

/// <summary>
/// Gets the analysis of the specified image file by using
/// the Computer Vision REST API.
/// </summary>
/// <param name="imageFilePath">The image file to analyze.</param>
static async Task<string> MakeAnalysisRequest(string imageFilePath,ILogger log)
{
    try
    {
    log.LogInformation("httpclient");

        HttpClient client = new HttpClient();

        // Request headers.
        client.DefaultRequestHeaders.Add(
            "Ocp-Apim-Subscription-Key", System.Environment.GetEnvironmentVariable("SubscriptionKey"));
           client.DefaultRequestHeaders
      .Accept
      .Add(new MediaTypeWithQualityHeaderValue("application/json"));


        string requestParameters =
            "visualFeatures=Description&language=en";

        // Assemble the URI for the REST API method.
        // endpoint https://westeurope.api.cognitive.microsoft.com/vision/v1.0/analyze
        string uri = System.Environment.GetEnvironmentVariable("VisionEndpoint") + "?" + requestParameters;
        // uri = "https://westeurope.api.cognitive.microsoft.com/vision/v1.0/analyze?visualFeatures=Description&language=en";
        log.LogInformation(uri);


        HttpResponseMessage response;


        var myObject = new {
            url = imageFilePath
        };
        log.LogInformation(JsonConvert.SerializeObject(myObject));
        var content = new StringContent(JsonConvert.SerializeObject(myObject), Encoding.UTF8, "application/json");
            response = await client.PostAsync(uri, content);

        // Asynchronously get the JSON response.
        return await response.Content.ReadAsStringAsync();


    }
    catch (Exception e)
    {
        log.LogInformation(e.Message);

        Console.WriteLine("\n" + e.Message);
        return "";
    }
}