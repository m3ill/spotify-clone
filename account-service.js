/**
 * Frontend önizleme adaptörü. Sunucuya istek göndermez, hesap oluşturmaz,
 * şifre doğrulamaz ve parolayı hiçbir depoya yazmaz.
 * Backend hazır olduğunda bu üç metodu gerçek servis çağrılarıyla değiştir.
 * UI, hata durumunda fırlatılan Error.message değerini formda gösterir.
 */
window.accountService = {
  async login({email, password}) {
    // password yalnız çağrı süresince bellektedir; kayıt/log/token üretilmez.
    const response = await fetch("http://localhost:3000/auth/login",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({email, password}),
      credentials: "include"
    });
    if(!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Login failed");
    }
    const data = await response.json();
    return {displayName: data.display_name, username: data.username, id: data.id};
  },
  async register({email, password, displayName, username}) {
    const response = await fetch("http://localhost:3000/auth/register",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password,
        username,
        display_name: displayName
    }),
      credentials: "include"
    });
    if(!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Registration failed");
    }
    const data = await response.json();
    return {displayName: data.display_name, username: data.username, id: data.id};
    
  },
  async logout() {
    const response = await fetch("http://localhost:3000/auth/logout",{
      method: "POST",
      credentials: "include"
    });

    if(!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Logout failed");
    }

    return response.ok;
  },
  async me(){
    const response = await fetch("http://localhost:3000/me",{
      method: "GET",
      credentials: "include"
    });

    if (response.status === 401) {
      return null; // Kullanıcı oturum açmamış
    }
    if(!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to fetch user info");
    }
    
    const data = await response.json();
    return {displayName: data.display_name, username: data.username, id: data.id, bio: data.bio};
  }
};
