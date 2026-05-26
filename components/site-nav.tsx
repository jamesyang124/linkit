import { auth } from "@/auth";
import { signOutAction } from "@/app/auth-actions";
import { NavShareLink } from "@/components/nav-share-link";

export async function SiteNav() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav
      data-testid="site-nav"
      className="site-nav flex items-start justify-between gap-4 px-5 py-4 text-xs uppercase md:px-8"
    >
      <a href="/" className="shrink-0 font-light leading-6">
        Linkit
      </a>
      <div className="flex max-w-[15rem] flex-wrap items-center justify-end gap-x-5 gap-y-2 text-right text-muted sm:max-w-none">
        {user ? (
          <>
            <NavShareLink className="leading-6" />
            <a href="/settings" className="leading-6">
              Profile
            </a>
            <form action={signOutAction} className="contents">
              <button
                type="submit"
                className="leading-6 text-muted transition hover:text-ink focus-visible:text-ink"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <a href="/signin" className="leading-6">
              Sign in
            </a>
            <NavShareLink className="leading-6" />
          </>
        )}
      </div>
    </nav>
  );
}
