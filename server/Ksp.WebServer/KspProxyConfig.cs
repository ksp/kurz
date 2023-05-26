using System;
using System.Net.Http;

namespace Ksp.WebServer
{
    public class KspProxyConfig
    {
        public string Host { get; set; }
        public string Authorization { get; set; }
        public string AuthCookie { get; set; } = "ksp_auth";
        public bool AllowInsecureCertificates { get; set; } = false;

        public Func<HttpRequestMessage, System.Security.Cryptography.X509Certificates.X509Certificate2, System.Security.Cryptography.X509Certificates.X509Chain, System.Net.Security.SslPolicyErrors, bool> GetSslValidationCallback()
        {
            if (AllowInsecureCertificates)
                return HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            return null;
        }
    }
}
