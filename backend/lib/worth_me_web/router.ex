defmodule WorthMeWeb.Router do
  use WorthMeWeb, :router

  import WorthMeWeb.UserAuth

  pipeline :api do
    plug :accepts, ["json"]
    plug :fetch_session           # Required to read the cookie
    plug :fetch_current_user      #tries to get user logged in from session

  end

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :put_root_layout, html: {WorthMeWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  scope "/api", WorthMeWeb do
    pipe_through :api

    get "/me", UserController, :show
    post "/statements", StatementController, :create
    get "/statements/latest", StatementController, :latest

    post "/users/register", UserRegistrationController, :create
    post "/users/log_in", UserSessionController, :create
    delete "/users/log_out", UserSessionController, :delete

    # Neon Auth / Google Sign In
    post "/auth/neon/callback", NeonAuthController, :callback
    get "/auth/neon/config", NeonAuthController, :config

    # M-Pesa Live Sync Routes
    post "/mpesa/sync", MpesaController, :sync
    get "/mpesa/status/:conversation_id", MpesaController, :status
  end

  # Enable Swoosh mailbox preview in development
  if Application.compile_env(:worth_me, :dev_routes) do

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  scope "/", WorthMeWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  ## Authentication routes

  scope "/", WorthMeWeb do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    get "/users/register", UserRegistrationController, :new
    post "/users/register", UserRegistrationController, :create
    get "/users/log_in", UserSessionController, :new
    post "/users/log_in", UserSessionController, :create
    get "/users/reset_password", UserResetPasswordController, :new
    post "/users/reset_password", UserResetPasswordController, :create
    get "/users/reset_password/:token", UserResetPasswordController, :edit
    put "/users/reset_password/:token", UserResetPasswordController, :update
  end

  scope "/", WorthMeWeb do
    pipe_through [:browser, :require_authenticated_user]

    get "/users/settings", UserSettingsController, :edit
    put "/users/settings", UserSettingsController, :update
    get "/users/settings/confirm_email/:token", UserSettingsController, :confirm_email
  end

  scope "/", WorthMeWeb do
    pipe_through [:browser]

    delete "/users/log_out", UserSessionController, :delete
    get "/users/confirm", UserConfirmationController, :new
    post "/users/confirm", UserConfirmationController, :create
    get "/users/confirm/:token", UserConfirmationController, :edit
    post "/users/confirm/:token", UserConfirmationController, :update
  end
end
