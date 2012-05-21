require "bundler/capistrano"
load "deploy/assets"

set :application,           "linus"
set :repository,            "git://github.com/pygatea/linus.git"
set :branch,                "master"

set :user,                  "deployer"
set :group,                 "deployer"
set :use_sudo,              false
set :ssh_options,           { :forward_agent => true, :keys => [File.join(ENV["HOME"], ".ssh", "deploylinus")]}

set :deploy_to,             "/home/deployer/apps/linus"
set :deploy_via,            :remote_cache
set :scm, :git

set :rails_env,             "production"
set :normalize_asset_timestamps, false
role :web,                  "linus.chicagoshadydealer.com" # Your HTTP server, Apache/etc
role :app,                  "linus.chicagoshadydealer.com" # This may be the same as your `Web` server
role :db,                   "linus.chicagoshadydealer.com", :primary => true # This is where Rails migrations will run

default_environment["RAILS_ENV"]  = 'production'
default_environment["PATH"]  = "/var/lib/gems/1.9.1/bin:$PATH"
default_run_options[:shell]       = 'bash'
default_run_options[:pty]         = true

# if you want to clean up old releases on each deploy uncomment this:
# after "deploy:restart", "deploy:cleanup"
after 'deploy:update_code', 'deploy:symlink_db'

namespace :deploy do
  desc "Symlinks the database.yml"
  task :symlink_db, :roles => :app do
    run "ln -nfs #{deploy_to}/shared/config/database.yml #{release_path}/config/database.yml"
  end
  task :start do ; end
  task :stop do ; end
  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo} touch #{File.join(current_path,'tmp','restart.txt')}"
  end
end
