using Newtonsoft.Json;

namespace TenantTrack.Test.Helpers;

public static class HttpClientExtensions
{

    public static async Task<T?> ReadAsJsonAsync<T>(this HttpContent content)
    {
        var dataAsString = await content.ReadAsStringAsync();

        return JsonConvert.DeserializeObject<T?>(dataAsString);
    }
}
