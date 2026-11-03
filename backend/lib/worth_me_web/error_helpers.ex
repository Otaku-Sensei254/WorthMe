defmodule WorthMeWeb.ErrorHelpers do
  @moduledoc """
  Conveniences for translating and building error messages.
  """

  use Phoenix.HTML

  @doc """
  Translates an error message using gettext.
  """
  def translate_error({msg, opts}) do
    Enum.reduce(opts, msg, fn {key, value}, acc ->
      placeholder = "%{#{key}}"

      if String.contains?(acc, placeholder) do
        String.replace(acc, placeholder, interpolate(value))
      else
        acc
      end
    end)
  end

  defp interpolate(value) when is_binary(value), do: value
  defp interpolate(value) when is_atom(value), do: Atom.to_string(value)
  defp interpolate(value) when is_number(value), do: to_string(value)
  defp interpolate(value) when is_list(value), do: Enum.map_join(value, ", ", &interpolate/1)
  defp interpolate(value), do: inspect(value)
end
