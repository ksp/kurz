using System.IO;
using AngleSharp.Html;
using Microsoft.AspNetCore.Http;

namespace Ksp.WebServer
{
    public class KspPageRewriter
    {
        public string RewriteHtml(string source, HttpContext context)
        {
            var p = new AngleSharp.Html.Parser.HtmlParser();
            var document = p.ParseDocument(source);

            foreach (var form in document.QuerySelectorAll("form"))
            {
                if (form.QuerySelector("input[type=password]") is null)
                    continue;

                var warning = document.CreateElement("div");
                warning.SetAttribute("style", "color: red; font-size: 3em; font-weight: bold");
                warning.TextContent = "Web běží na magické proxy, které byste měli věřit!!!";
                form.Prepend(warning);
            }



            var outputHtml = new StringWriter();
            document.ToHtml(outputHtml, new PrettyMarkupFormatter() { Indentation = "\t", NewLine = "\n" });
            return outputHtml.ToString();
        }
    }
}
