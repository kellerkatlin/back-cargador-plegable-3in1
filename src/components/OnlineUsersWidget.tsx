import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Activity, MapPin } from "lucide-react";

interface UserPresence {
  ip_address: string;
  session_id?: string;
  page_path: string;
  last_seen: string;
  user_agent: string;
  country?: string;
  city?: string;
  region?: string;
}

export const OnlineUsersWidget = () => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función para obtener usuarios en línea
    const fetchOnlineUsers = async () => {
      try {
        // Obtener usuarios activos (últimos 5 minutos) SOLO de páginas públicas (no admin)
        const fiveMinutesAgo = new Date(
          Date.now() - 5 * 60 * 1000
        ).toISOString();

        const { data, error } = await supabase
          .from("user_presence")
          .select("*")
          .gte("last_seen", fiveMinutesAgo)
          .not("page_path", "like", "/admin%") // Excluir rutas de admin
          .order("last_seen", { ascending: false });

        if (error) throw error;
        setOnlineUsers(data || []);
      } catch (error) {
        console.error("Error fetching online users:", error);
      } finally {
        setLoading(false);
      }
    };

    // Actualizar cada 10 segundos
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 10000);

    // Suscripción en tiempo real
    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const getPageName = (path: string) => {
    const pages: Record<string, string> = {
      "/": "🏠 Página Principal",
      "/admin": "📊 Dashboard Admin",
      "/admin/login": "🔐 Login Admin",
    };
    return pages[path] || `📄 ${path}`;
  };

  const getBrowser = (userAgent: string) => {
    if (userAgent.includes("Chrome") && !userAgent.includes("Edge"))
      return "🌐 Chrome";
    if (userAgent.includes("Firefox")) return "🦊 Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "🧭 Safari";
    if (userAgent.includes("Edge")) return "📘 Edge";
    if (userAgent.includes("Mobile")) return "📱 Móvil";
    return "🌍 Navegador";
  };

  const getDeviceType = (userAgent: string) => {
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) return "📱";
    if (/Tablet|iPad/i.test(userAgent)) return "📱";
    return "💻";
  };

  const getCountryFlag = (country?: string) => {
    const flags: Record<string, string> = {
      Peru: "🇵🇪",
      "United States": "🇺🇸",
      Mexico: "🇲🇽",
      Colombia: "🇨🇴",
      Argentina: "🇦🇷",
      Chile: "🇨🇱",
      Spain: "🇪🇸",
      Brazil: "🇧🇷",
      Ecuador: "🇪🇨",
      Bolivia: "🇧🇴",
      Venezuela: "🇻🇪",
    };
    return flags[country || ""] || "🌎";
  };

  const getLocation = (user: UserPresence) => {
    if (user.city && user.country) {
      return `${user.city}, ${user.country}`;
    }
    if (user.country) {
      return user.country;
    }
    return "Ubicación desconocida";
  };

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-muted rounded-full" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-5 h-5 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <h3 className="font-semibold text-lg">Usuarios en Línea</h3>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
          <Activity className="w-4 h-4" />
          <span className="font-bold text-xl">{onlineUsers.length}</span>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">
              No hay usuarios en línea actualmente
            </p>
          </div>
        ) : (
          onlineUsers.map((user) => {
            const timeDiff = Math.floor(
              (Date.now() - new Date(user.last_seen).getTime()) / 1000
            );
            const timeAgo =
              timeDiff < 60
                ? "🟢 Ahora mismo"
                : timeDiff < 120
                ? "🟢 Hace 1 minuto"
                : timeDiff < 300
                ? `🟢 Hace ${Math.floor(timeDiff / 60)} minutos`
                : `🟡 Hace ${Math.floor(timeDiff / 60)} minutos`;

            return (
              <div
                key={user.ip_address}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        timeDiff < 60
                          ? "bg-green-500 animate-pulse"
                          : "bg-yellow-500"
                      }`}
                    />
                    <span className="text-lg">
                      {getDeviceType(user.user_agent)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getPageName(user.page_path)}
                    </p>

                    {/* Ubicación */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="mr-1">
                          {getCountryFlag(user.country)}
                        </span>
                        {getLocation(user)}
                      </p>
                    </div>

                    {/* Navegador */}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getBrowser(user.user_agent)}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {timeAgo}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer con info adicional */}
      {onlineUsers.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Actualización automática cada 10s</span>
            <span>
              {onlineUsers.filter((u) => u.page_path === "/").length} en inicio
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
