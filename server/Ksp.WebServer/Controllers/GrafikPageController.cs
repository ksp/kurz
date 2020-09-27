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

namespace Ksp.WebServer.Controllers
{
    [ApiController]
    [Route("grafik")]
    public class GrafikPageController : ControllerBase
    {
        private readonly ILogger<TasksController> logger;
        private readonly IWebHostEnvironment env;

        public GrafikPageController(
            ILogger<TasksController> logger,
            IWebHostEnvironment env)
        {
            this.env = env;
            this.logger = logger;
        }

        async Task<string> FetchBlankPage()
        {
            var c = new HttpClient();
            var rq = new HttpRequestMessage(HttpMethod.Get, "https://ksp-test.ks.matfyz.cz/blank");
            rq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/html"));
            rq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/xhtml+xml"));
            rq.Headers.Authorization =
                new AuthenticationHeaderValue("Basic", "SECRET");
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

            var innerBody = grafik.Body;
            innerBody.Replace(kspTemplate.Body);
            var page = grafik.Body.QuerySelector("#page");
            page.InnerHtml = "";
            page.AppendNodes(innerBody.ChildNodes.ToArray());

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
