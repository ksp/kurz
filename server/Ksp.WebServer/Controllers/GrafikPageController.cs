using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using AngleSharp;
using AngleSharp.Dom;
using System.Net.Http;
using System.Net.Http.Headers;
using AngleSharp.Html;
using Microsoft.Extensions.Options;

namespace Ksp.WebServer.Controllers
{
    [ApiController]
    [Route("kurz")]
    public class GrafikPageController : ControllerBase
    {
        private readonly ILogger<TasksController> logger;
        private readonly IWebHostEnvironment env;
        private readonly KspPageRewriter pageRewriter;
        private readonly KspProxyConfig kspProxyConfig;

        string KspAuthCookie => this.HttpContext.Request.Cookies[kspProxyConfig.AuthCookie];

        public GrafikPageController(
            ILogger<TasksController> logger,
            IWebHostEnvironment env,
            IOptions<KspProxyConfig> kspProxyConfig,
            KspPageRewriter pageRewriter)
        {
            this.env = env;
            this.pageRewriter = pageRewriter;
            this.kspProxyConfig = kspProxyConfig.Value;
            this.logger = logger;
        }

        async Task<string> FetchBlankPage()
        {
            var c = new HttpClient();
            var rq = new HttpRequestMessage(HttpMethod.Get, $"{kspProxyConfig.Host}/blank");
            rq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/html"));
            rq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/xhtml+xml"));
            if (!string.IsNullOrEmpty(kspProxyConfig.Authorization))
                rq.Headers.Authorization =
                    AuthenticationHeaderValue.Parse(kspProxyConfig.Authorization);
            if (HttpContext.Request.Headers.TryGetValue("Cookie", out var x))
                rq.Headers.Add("Cookie", x.AsEnumerable());
            var rs = await c.SendAsync(rq);
            return await rs.Content.ReadAsStringAsync();
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var grafikPage = await System.IO.File.ReadAllTextAsync(Path.Combine(env.ContentRootPath, "../../frontend/public/grafik.html"));
            var p = new AngleSharp.Html.Parser.HtmlParser();
            var grafik = p.ParseDocument(grafikPage);

            var kspTemplate = p.ParseDocument(await FetchBlankPage());
            pageRewriter.ModifyTree(kspTemplate, "kurz");

            var innerBody = grafik.Body;
            innerBody.Replace(kspTemplate.Body);
            var page = grafik.Body.QuerySelector("#page");
            page.InnerHtml = "";
            page.AppendNodes(innerBody.ChildNodes.ToArray());

            if (KspAuthCookie is object)
            {
                var user = KspAuthenticator.ParseAuthCookie(KspAuthCookie);
                var metaUser = grafik.CreateElement("meta");
                metaUser.SetAttribute("name", "x-ksp-uid");
                metaUser.SetAttribute("content", user.Id.Value.ToString());
                grafik.Head.AppendChild(metaUser);
            }

            foreach(var headElement in kspTemplate.Head.QuerySelectorAll("link, script"))
            {
                headElement.RemoveFromParent();
                grafik.Head.AppendChild(headElement);
            }

            var outputHtml = new StringWriter();
            grafik.ToHtml(outputHtml, new PrettyMarkupFormatter() { Indentation = "\t", NewLine = "\n" });


            return this.Content(outputHtml.ToString(), "text/html");
        }
    }
}
