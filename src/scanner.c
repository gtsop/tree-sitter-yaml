#include "tree_sitter/parser.h"

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

enum TokenType {
    INDENT,
    DEDENT,
};

#define MAX_LEVELS (TREE_SITTER_SERIALIZATION_BUFFER_SIZE / sizeof(uint32_t))

typedef struct {
    uint32_t columns[MAX_LEVELS];
    unsigned depth;
} Scanner;

void *tree_sitter_yaml_external_scanner_create(void) {
    Scanner *scanner = calloc(1, sizeof *scanner);
    if (scanner) {
        scanner->depth = 1;  // The root level starts at column zero.
    }
    return scanner;
}

void tree_sitter_yaml_external_scanner_destroy(void *payload) {
    free(payload);
}

unsigned tree_sitter_yaml_external_scanner_serialize(
    void *payload, char *buffer
) {
    Scanner *scanner = payload;
    unsigned length = scanner->depth * sizeof scanner->columns[0];
    memcpy(buffer, scanner->columns, length);
    return length;
}

void tree_sitter_yaml_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length
) {
    Scanner *scanner = payload;
    scanner->depth = 1;
    scanner->columns[0] = 0;

    if (length > 0) {
        memcpy(scanner->columns, buffer, length);
        scanner->depth = length / sizeof scanner->columns[0];
    }
}

bool tree_sitter_yaml_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols
) {
    Scanner *scanner = payload;
    if (!valid_symbols[INDENT] && !valid_symbols[DEDENT]) {
        return false;
    }

    uint32_t column = 0;
    if (!lexer->eof(lexer)) {
        if (lexer->get_column(lexer) != 0) {
            return false;
        }

        // Peek at the indentation while keeping the token zero-width.
        lexer->mark_end(lexer);
        while (lexer->lookahead == ' ') {
            lexer->advance(lexer, false);
            column++;
        }

        if (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
            return false;
        }
        if (lexer->eof(lexer)) {
            column = 0;
        }
    } else {
        lexer->mark_end(lexer);
    }

    uint32_t current = scanner->columns[scanner->depth - 1];
    if (column > current && valid_symbols[INDENT] &&
        scanner->depth < MAX_LEVELS) {
        scanner->columns[scanner->depth++] = column;
        lexer->result_symbol = INDENT;
        return true;
    }

    if (column < current && valid_symbols[DEDENT]) {
        scanner->depth--;
        lexer->result_symbol = DEDENT;
        return true;
    }

    return false;
}
