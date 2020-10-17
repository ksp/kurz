using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using AspNetCore.Proxy;
using AspNetCore.Proxy.Builders;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ksp.WebServer
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers();
            services.AddHttpClient("RedirectClient")
                .ConfigurePrimaryHttpMessageHandler(h => {
                return new HttpClientHandler {
                    AllowAutoRedirect = false,
                    UseCookies = false,
                    AutomaticDecompression = DecompressionMethods.All
                };
            });
            services.AddProxies();
            services.Configure<KspProxyConfig>(Configuration.GetSection(nameof(KspProxyConfig)));
            services.AddSingleton<KspPageRewriter>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, IOptions<KspProxyConfig> kspProxyConfig, KspPageRewriter pageRewriter)
        {
            Console.WriteLine($"Running {env.EnvironmentName} env, root={env.ContentRootPath}, host={kspProxyConfig.Value.Host}");

            app.UseDeveloperExceptionPage();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            app.UseRewriter(new RewriteOptions()
                .AddRewrite("^grafik$", "grafik.html", true)
            );

            app.UseStaticFiles(new StaticFileOptions {
                FileProvider = new PhysicalFileProvider(
                    Path.Combine(env.ContentRootPath, "../../frontend/public")),
            });

            app.RunProxy(proxy => proxy
                .UseHttp((context, args) =>
                {
                    return kspProxyConfig.Value.Host;
                }, opt => {
                    var baseUri = new Uri(kspProxyConfig.Value.Host);
                    opt.WithHttpClientName("RedirectClient");

                    opt.WithBeforeSend((cx, request) => {
                        if (request.Headers.Authorization is null && !string.IsNullOrEmpty(kspProxyConfig.Value.Authorization))
                        {
                            request.Headers.Authorization =
                                AuthenticationHeaderValue.Parse(kspProxyConfig.Value.Authorization);
                        }
                        if (request.Headers.Referrer is object)
                        {
                            request.Headers.Referrer =
                                new UriBuilder(request.Headers.Referrer) {
                                    Host = baseUri.Host,
                                    Port = baseUri.Port,
                                    Scheme = baseUri.Scheme
                                }.Uri;
                        }
                        // Console.WriteLine(request);
                        return Task.CompletedTask;
                    });
                    opt.WithAfterReceive(async (cx, response) => {
                        // Console.WriteLine(response);
                        if (response.Headers.Location is object && response.Headers.Location.Host == baseUri.Host)
                        {
                            response.Headers.Location = new UriBuilder(response.Headers.Location) {
                                Host = cx.Request.Host.Host,
                                Port = cx.Request.Host.Port ?? (cx.Request.Scheme == "https" ? 443 : 80),
                                Scheme = cx.Request.Scheme
                            }.Uri;
                        }
                        if (response.Headers.TryGetValues("Set-Cookie", out var v))
                        {
                            response.Headers.Remove("Set-Cookie");
                            response.Headers.Add("Set-Cookie", v.Select(s =>
                                s.Replace("; secure", "")
                                 .Replace($"; domain={baseUri.Host}", $"; domain={cx.Request.Host.Host}")
                            ));
                        }

                        if (new [] { "text/html", "application/xhtml+xml" }.Contains(response.Content?.Headers?.ContentType?.MediaType))
                        {
                            var str = await response.Content.ReadAsStringAsync();
                            str = pageRewriter.RewriteHtml(str, cx);
                            response.Content = new StringContent(str, Encoding.UTF8, "text/html");
                        }
                    });
                }));
        }
    }
}
