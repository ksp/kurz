using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AngleSharp.Html.Dom;
using AngleSharp.Html.Parser;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ksp.WebServer
{
    public class KspAuthenticator
    {
        readonly KspProxyConfig kspProxyConfig;
        readonly ILogger<KspAuthenticator> logger;

        // request to https://ksp.mff.cuni.cz/auth/manage.cgi?mode=change
        // contains user information

        public KspAuthenticator(
            IOptions<KspProxyConfig> kspProxyConfig,
            ILogger<KspAuthenticator> logger)
        {
            this.kspProxyConfig = kspProxyConfig.Value;
            this.logger = logger;
        }

        public static UnverifiedAuthCookie ParseAuthCookie(string cookie)
        {
            var s = cookie.Split(':');
            return new UnverifiedAuthCookie(
                UserId.Parse(s[1]),
                s[3],
                s[2].Split(',')
            );
        }

        async Task<IHtmlDocument> FetchPage(string url, string authCookie)
        {
            var cookies = new CookieContainer();
            cookies.Add(new Uri(kspProxyConfig.Host), new Cookie("ksp_auth", Uri.EscapeDataString(authCookie)));
            var c = new HttpClient(new HttpClientHandler { CookieContainer = cookies });
            var rq = new HttpRequestMessage(HttpMethod.Get, $"{kspProxyConfig.Host}/{url}");
            rq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/html"));
            rq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/xhtml+xml"));
            if (!string.IsNullOrEmpty(kspProxyConfig.Authorization))
                rq.Headers.Authorization =
                    AuthenticationHeaderValue.Parse(kspProxyConfig.Authorization);
            var rs = await c.SendAsync(rq);
            logger.LogInformation("Verification response {code}", rs.StatusCode);
            if (rs.StatusCode != HttpStatusCode.OK)
                return null;
            var response = await rs.Content.ReadAsStringAsync();
            var parser = new HtmlParser();
            return parser.ParseDocument(response);
        }

        public async Task<VerifiedUserInfo> VerifyUser(string cookie)
        {
            var parsedCookie = ParseAuthCookie(cookie);
            logger.LogInformation("Verifying user {uid}", parsedCookie.Id);
            var page = await FetchPage("auth/manage.cgi?mode=change", cookie);
            var form = page?.QuerySelector("#content form");
            var email = (form?.QuerySelector("input#email") as IHtmlInputElement)?.Value;
            var userName = (form?.QuerySelector("input#logname") as IHtmlInputElement)?.Value;
            var showName = (form?.QuerySelector("input#showname") as IHtmlInputElement)?.Value;
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(showName))
            {
                logger.LogWarning("User {uid} verification failed: email={email}, userName={userName}, name={name}", parsedCookie.Id.Value, email, userName, showName);
                return null;
            }
            logger.LogWarning("User {uid} verified: email={email}, userName={userName}, name={name}", parsedCookie.Id.Value, email, userName, showName);
            return new VerifiedUserInfo(
                parsedCookie.Id,
                showName,
                parsedCookie.Roles,
                email,
                userName
            );
        }
    }

    public sealed class UserId
    {
        public int Value { get; }
        public UserId(int value)
        {
            this.Value = value;
        }

        public override bool Equals(object obj)
        {
            return obj is UserId id &&
                   Value == id.Value;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Value);
        }

        public override string ToString() => $"uid[{Value}]";
        public static UserId Parse(string val)
        {
            var id = int.Parse(val);
            if (id <= 0) throw new Exception();
            return new UserId(id);
        }
    }

    // Cookie, for example 1603380331:1662:auth_master,org:Standa=20Luke=c5=a1:SIGNATURE
    public sealed class UnverifiedAuthCookie
    {
        public UserId Id { get; }
        public string FullName { get; }
        public string[] Roles { get; }
        public UnverifiedAuthCookie(UserId id, string fullName, string[] roles)
        {
            this.Id = id;
            this.FullName = fullName;
            this.Roles = roles;
        }
    }

    public sealed class VerifiedUserInfo
    {
        public UserId Id { get; }
        public string FullName { get; }
        public string[] Roles { get; }
        public string Email { get; }
        public string UserName { get; }

        public VerifiedUserInfo(UserId id, string fullName, string[] roles, string email, string userName)
        {
            this.Id = id;
            this.FullName = fullName;
            this.Roles = roles;
            this.Email = email;
            this.UserName = userName;
        }
    }
}
