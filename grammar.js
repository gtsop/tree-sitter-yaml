/**
 * @file Yaml grammar
 * @author George Tsopanoglou <gtsop+github@protonmail.com>
 * @license AGPLv3
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "yaml",

  externals: ($) => [$._indent, $._dedent],
  extras: () => [/[ \t]+/],

  rules: {
    source_file: ($) => $.node,
    // source_file: ($) => seq(repeat($._line_break), $.node),

    /*
     * Nodes
     */
    node: ($) => choice($.sequence, $.mapping),

    scalar: ($) => choice($.null, $.bool, $.int, $.float, $.str),

    //sequence: ($) => repeat1(seq(token("-"), $.scalar)),
    sequence: ($) =>
      seq(
        $._scalar_item,
        repeat(seq($._line_break, $._scalar_item)),
        optional($._line_break),
      ),

    _scalar_item: ($) => seq(token(prec(1, /-[ \t]+/)), $.scalar),

    _line_break: () => /\r\n|\n|\r/,

    mapping: ($) => repeat1($.mapping_entry),
    mapping_entry: ($) => seq($.mapping_key, ":", $.mapping_value),

    mapping_value: ($) =>
      choice(
        seq($.scalar, $._line_break),
        seq($._line_break, $._indent, $.node, $._dedent),
      ),
    mapping_key: ($) => $.scalar,

    /*
     * Scalars
     */
    null: () => choice(token("null"), token("Null"), token("NULL"), token("~")),
    bool: ($) => choice($.true, $.false),
    true: () => choice(token("true"), token("True"), token("TRUE")),
    false: () => choice(token("false"), token("False"), token("FALSE")),
    int: ($) => choice($._int_10, $._int_8, $._int_16),
    _int_10: () => /[-+]?[0-9]+/,
    _int_8: () => /0o[0-7]+/,
    _int_16: () => /0x[0-9a-fA-F]+/,
    float: ($) => choice($._double, $._inf, $._nan),
    _double: () => /[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)?/,
    _inf: () => /[-+]?(\.inf|\.Inf|\.INF)/,
    _nan: () => /(\.nan|\.NaN|\.NAN)/,
    //str: () => /[^\r\n]+/,
    str: () => /[^ \t\r\n:](?:[^\r\n:]*[^ \t\r\n:])?/,

    /*
     * Indicators
     */
    c_sequence_entry: () => token("-"),
    c_mapping_key: () => token("?"),
    c_mapping_value: () => token(":"),
    c_collect_entry: () => token(","),
    c_sequence_start: () => token("["),
    c_sequence_end: () => token("]"),
    c_mapping_start: () => token("{"),
    c_mapping_end: () => token("}"),
    c_comment: () => token("#"),
    c_anchor: () => token("&"),
    c_alias: () => token("*"),
    c_tag: () => token("!"),
    c_literal: () => token("|"),
    c_folded: () => token(">"),
    c_single_quote: () => token("'"),
    c_double_quote: () => token('"'),
    c_directive: () => token("%"),
    c_reserved: () => choice(token("@"), token("`")),
    c_indicator: ($) =>
      choice(
        $.c_sequence_entry,
        $.c_mapping_key,
        $.c_mapping_value,
        $.c_collect_entry,
        $.c_sequence_start,
        $.c_sequence_end,
        $.c_mapping_start,
        $.c_mapping_end,
        $.c_comment,
        $.c_anchor,
        $.c_alias,
        $.c_tag,
        $.c_literal,
        $.c_folded,
        $.c_single_quote,
        $.c_double_quote,
        $.c_directive,
        $.c_reserved,
      ),
    c_flow_indicator: ($) =>
      choice(
        $.c_collect_entry,
        $.c_sequence_start,
        $.c_sequence_end,
        $.c_mapping_start,
        $.c_mapping_end,
      ),

    /*
     * Line breaks
     */
    b_line_feed: () => token("\n"),
    b_carriage_return: () => token("\r"),
    b_char: ($) => choice($.b_line_feed, $.b_carriage_return),
    b_break: ($) =>
      choice(
        seq($.b_carriage_return, $.b_line_feed),
        $.b_carriage_return,
        $.b_line_feed,
      ),
    b_as_line_feed: ($) => $.b_break,
    b_non_content: ($) => $.b_break,

    // nb_char: () => c_printable - c_char - c_byte_order_mark

    /*
     * White space characters
     */
    s_space: () => token(" "),
    s_tab: () => token("\t"),
    s_white: ($) => choice($.s_space, $.s_tab),

    // ns_char: () => nb_char - s_white

    /*
     * Miscellaneous Characters
     */
    ns_dec_digit: () => /[0-9]/,
    ns_hex_digit: ($) => choice($.ns_dec_digit, /[A-F]/, /[a-f]/),
    ns_ascii_letter: () => choice(/[A-Z]/, /[a-z]/),
    ns_word_char: ($) => choice($.ns_dec_digit, $.ns_ascii_letter, "-"),

    ns_uri_char: ($) =>
      choice(
        seq("%", seq($.ns_hex_digit, $.ns_hex_digit)),
        $.ns_word_char,
        "#",
        ";",
        "/",
        "?",
        ":",
        "@",
        "&",
        "=",
        "+",
        "$",
        ",",
        "_",
        ".",
        "!",
        "~",
        "*",
        "'",
        "(",
        ")",
        "[",
        "]",
      ),

    // ns_tag_char: ns_uri_char - c_tag - c_flow_indicator

    /*
     * Escaped Characters
     */
    c_escape: () => token("\\"),
    ns_esc_null: () => token("0"),
    ns_esc_bell: () => token("a"),
    ns_esc_backspace: () => token("b"),
    ns_esc_horizontal_tab: () => choice(token("t"), token("x09")),
    ns_esc_line_feed: () => token("n"),
    ns_esc_vertical_tab: () => token("v"),
    ns_esc_form_feed: () => token("f"),
    ns_esc_carriage_return: () => token("r"),
    ns_esc_escape: () => token("e"),
    ns_esc_space: () => token("x20"),
    ns_esc_double_quote: () => token('"'),
    ns_esc_slash: () => token("/"),
    ns_esc_backslash: () => token("\\"),
    ns_esc_next_line: () => token("N"),
    ns_esc_non_breaking_space: () => token("_"),
    ns_esc_line_separator: () => token("L"),
    ns_esc_paragraph_separator: () => token("P"),
    ns_esc_8_bit: ($) => seq("x", $.ns_hex_digit, $.ns_hex_digit),
    ns_esc_16_bit: ($) =>
      seq("u", $.ns_hex_digit, $.ns_hex_digit, $.ns_hex_digit, $.ns_hex_digit),
    ns_esc_32_bit: ($) =>
      seq(
        "U",
        $.ns_hex_digit,
        $.ns_hex_digit,
        $.ns_hex_digit,
        $.ns_hex_digit,
        $.ns_hex_digit,
        $.ns_hex_digit,
        $.ns_hex_digit,
        $.ns_hex_digit,
      ),
    c_ns_esc_char: ($) =>
      seq(
        $.c_escape,
        choice(
          $.ns_esc_null,
          $.ns_esc_bell,
          $.ns_esc_backspace,
          $.ns_esc_horizontal_tab,
          $.ns_esc_line_feed,
          $.ns_esc_vertical_tab,
          $.ns_esc_form_feed,
          $.ns_esc_carriage_return,
          $.ns_esc_escape,
          $.ns_esc_space,
          $.ns_esc_double_quote,
          $.ns_esc_slash,
          $.ns_esc_backslash,
          $.ns_esc_next_line,
          $.ns_esc_non_breaking_space,
          $.ns_esc_line_separator,
          $.ns_esc_paragraph_separator,
          $.ns_esc_8_bit,
          $.ns_esc_16_bit,
          $.ns_esc_32_bit,
        ),
      ),
  },
});
