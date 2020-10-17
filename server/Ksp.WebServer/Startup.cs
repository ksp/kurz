using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
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
                    UseCookies = false
                };
            });
            services.AddProxies();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
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
                    return "https://ksp-test.ks.matfyz.cz";
                }, opt => {
                    opt.WithHttpClientName("RedirectClient");

                    opt.WithBeforeSend((cx, request) => {
                        if (request.Headers.Authorization is null)
                        {
                            request.Headers.Authorization =
                                new AuthenticationHeaderValue("Basic", "SECRET");
                        }
                        if (request.Headers.Referrer is object)
                            request.Headers.Referrer =
                                new UriBuilder(request.Headers.Referrer) {
                                    Host = "ksp-test.ks.matfyz.cz",
                                    Port = 443,
                                    Scheme = "https"
                                }.Uri;
                        // request.Headers.Remove("X-Forwarded-For");
                        // request.Headers.Remove("X-Forwarded-Proto");
                        // request.Headers.Remove("X-Forwarded-Host");
                        // request.Headers.Remove("Forwarded");
                        // request.Headers.Remove("Origin");
                        // request.Headers.Add("Origin", "https://ksp-test.ks.matfyz.cz");
                        // Console.WriteLine(request);
                        return Task.CompletedTask;
                    });
                    opt.WithAfterReceive((cx, response) => {
                        // Console.WriteLine(response);
                        if (response.Headers.Location is object && response.Headers.Location.Host == "ksp-test.ks.matfyz.cz")
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
                                 .Replace("; domain=ksp-test.ks.matfyz.cz", $"; domain={cx.Request.Host.Host}")
                            ));
                        }
                        return Task.CompletedTask;
                    });
                }));
        }
    }
}
