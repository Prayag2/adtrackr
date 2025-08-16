{ pkgs, lib, config, ... }: {
  languages = {
    javascript = {
      enable = true;
      npm.enable = true;
    };
  };

  services = {
    postgres = {
      enable = true;
      listen_addresses = "localhost";
      initialDatabases = [
        {
          name = "digivantrix";
        }
      ];
      initialScript = ''
        CREATE USER prayag WITH PASSWORD 'password';
        GRANT ALL PRIVILEGES ON DATABASE digivantrix TO prayag;
      '';
    };
  };

}
