using System.IO;
using AngleSharp.Html;
using Microsoft.AspNetCore.Http;
using System.Linq;
using AngleSharp.Html.Dom;

namespace Ksp.WebServer
{
    public class KspPageRewriter
    {
        public string RewriteHtml(string source, HttpContext context)
        {
            var p = new AngleSharp.Html.Parser.HtmlParser();
            var document = p.ParseDocument(source);

            ModifyTree(document, context.Request.Path.Value.Trim('/'));

            var outputHtml = new StringWriter();
            document.ToHtml(outputHtml, new HtmlMarkupFormatter());
            return outputHtml.ToString();
        }

        public void ModifyTree(IHtmlDocument document, string path)
        {
            foreach (var form in document.QuerySelectorAll("form"))
            {
                if (form.QuerySelector("input[type=password]") is null)
                    continue;

                var warning = document.CreateElement("div");
                warning.SetAttribute("style", "color: red; font-size: 3em; font-weight: bold");
                warning.TextContent = "Web běží na magické proxy, které byste měli věřit!!!";
                form.Prepend(warning);
            }

            var encyklopedie = document.QuerySelectorAll("#menu ul li:not(.active) a").FirstOrDefault(x => x.TextContent.Trim() == "Encyklopedie");
            if (encyklopedie is object)
            {
                encyklopedie.TextContent = "Kurzy";
                encyklopedie.SetAttribute("href", "/grafik");
                if ("grafik" == path)
                {
                    encyklopedie.ParentElement.ClassList.Add("active");
                }
            }

            var logo = document.QuerySelector("#logo > h1:nth-child(1) > a:nth-child(1)");
            if (logo is object)
            {
                logo.TextContent = "KSP Hacked Edition";
            }
        }
    }
}
