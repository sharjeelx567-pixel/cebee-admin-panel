import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Pagination,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { colors } from '../../config/theme';

const DataTable = ({
  columns,
  data,
  loading = false,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  emptyMessage = 'No data available',
}) => {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '0 0 12px 12px',
          border: `1.5px solid ${colors.divider}26`,
          borderTop: 'none',
          boxShadow: 'none',
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          maxWidth: '100%',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-thumb': { borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)' },
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 6,
            }}
          >
            <CircularProgress sx={{ color: colors.brandRed }} />
          </Box>
        ) : (
          <>
            <Table sx={{ minWidth: 'max-content', tableLayout: 'auto' }}>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: `${colors.backgroundLight}40`,
                    borderBottom: `1.5px solid ${colors.divider}40`,
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      sx={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: colors.brandBlack,
                        padding: '18px 20px',
                        borderBottom: 'none',
                        whiteSpace: 'nowrap',
                        minWidth: column.minWidth ?? undefined,
                        width: column.width ?? undefined,
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      sx={{
                        textAlign: 'center',
                        padding: 6,
                        color: colors.textSecondary,
                      }}
                    >
                      <Typography variant="body2">{emptyMessage}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      onClick={() => onRowClick && onRowClick(row)}
                      sx={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        backgroundColor: colors.brandWhite,
                        '&:hover': onRowClick
                          ? {
                              backgroundColor: `${colors.backgroundLight}30`,
                            }
                          : {},
                        borderBottom: `1.5px solid ${colors.divider}30`,
                        transition: 'background-color 0.2s ease',
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          sx={{
                            padding: '20px 20px',
                            fontSize: 14,
                            color: colors.textPrimary,
                            borderBottom: 'none',
                            whiteSpace: 'nowrap',
                            minWidth: column.minWidth ?? undefined,
                            width: column.width ?? undefined,
                          }}
                        >
                          {column.render
                            ? column.render(row[column.id], row)
                            : row[column.id]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {totalCount > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '24px 20px',
                  backgroundColor: colors.brandWhite,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => onPageChange(e, page - 1)}
                    disabled={page === 0}
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: colors.brandWhite,
                      border: 'none',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: `${colors.backgroundLight}60`,
                      },
                      '&.Mui-disabled': {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <ChevronLeft sx={{ fontSize: 22, color: colors.textSecondary }} />
                  </IconButton>
                  
                  {Array.from({ length: Math.min(5, Math.ceil(totalCount / rowsPerPage)) }, (_, i) => {
                    let pageNum;
                    const totalPages = Math.ceil(totalCount / rowsPerPage);
                    
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <IconButton
                        key={pageNum}
                        size="small"
                        onClick={(e) => onPageChange(e, pageNum)}
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: page === pageNum ? colors.brandRed : 'transparent',
                          color: page === pageNum ? colors.brandWhite : colors.brandBlack,
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: page === pageNum ? 600 : 500,
                          fontSize: 14,
                          '&:hover': {
                            backgroundColor: page === pageNum ? colors.brandRed : `${colors.backgroundLight}60`,
                          },
                        }}
                      >
                        {pageNum + 1}
                      </IconButton>
                    );
                  })}
                  
                  <IconButton
                    size="small"
                    onClick={(e) => onPageChange(e, page + 1)}
                    disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: colors.brandWhite,
                      border: 'none',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: `${colors.backgroundLight}60`,
                      },
                      '&.Mui-disabled': {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <ChevronRight sx={{ fontSize: 22, color: colors.textSecondary }} />
                  </IconButton>
                </Box>
              </Box>
            )}
          </>
        )}
      </TableContainer>
    </Box>
  );
};

export default DataTable;
