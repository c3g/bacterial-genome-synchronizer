#' Synchronization Function
#'
#' This function receives an genome sequence and a short sequence and 
#' "synchronizes" the genome to start at the first position of the start sequence
#' with the same orientation as the start sequence
#' @param sample_input  path to a FASTA file or string input (max 15 Mb)
#' @param start_seq string sequence usually with  20-50 characters
#' @param file_input defaults to TRUE, specifies sample_input format
#' @keywords cats
#' @export
#' @examples
#' sample_file <- "example_input/NZ_CP022077.1.txt"
#' sample_seq <- "ATGCTTTTATGCATCGATGAATCCAAGCCAAATACTGTAGATGATCCATCGTAAA"
#' start_seq <- "ATGAATCCAAGCCAAATACT"
#' sync(sample_file, start_seq, file_input = TRUE)
#' sync(sample_seq, start_seq, file_input = FALSE)

sync <- function(sample_input, start_seq, file_input = TRUE) {
    require("Biostrings")
    require("stringi")

    if (file_input == TRUE) { ## read an uploaded file as a string
        sample_seq <- 
            toString(
                readDNAStringSet(sample_input)
            )
    } else { ## or read a string directly
        sample_seq <- sample_input
    }

    # find where the start_seq sequence is in the full genome
    check_forward <- regexpr(start_seq, sample_seq)[1]

    # if there is no match...
    if (check_forward==-1) { # check reverse compliment
        revCstart_seq <- chartr("ATGC","TACG", start_seq) # compliment
        revCstart_seq <- stringi::stri_reverse(revCstart_seq) # reverse

        check_reverse <- regexpr(revCstart_seq, sample_seq)[1]

        if (check_reverse==-1) { # reverse compliment does not match
            start_seq_absent <- TRUE
        } else { # reverse compliment matches
            start_seq_absent <- FALSE
            # reverse compliment the whole sequence
            revCseq <- chartr("ATGC","TACG", sample_seq)
            revCseq <- stringi::stri_reverse(revCseq)
            # rearrange genome accordingly
            synced_start <- 
                regexpr(start_seq, revCseq)[1]
            synced_seq <- 
                # attaches two sections of the genome
                paste0(
                    # from beginning of start_seq to end of genome
                    substr(
                        revCseq, 
                        synced_start,
                        nchar(revCseq)
                    ), 
                    # attach the beginning to the end
                    substr(
                        revCseq, 
                        1,
                        synced_start-1
                    )
                )
        }
    } else { #start sequence matches forward 
        primer_absent <- FALSE
        synced_seq <- 
            #attaches two sections of the genome
            paste0(
                #from beginning of start_seq to end of genome
                substr(
                    sample_seq, 
                    check_forward,
                    nchar(sample_seq)
                    ), 
                #attach the beginning to the end
                substr(
                    sample_seq, 
                    1,
                    check_forward-1
                )
            )
    } # sync end
    if (start_seq_absent==TRUE) {
        return("start sequence not found")
    } else {
        return(synced_seq)
    }
}
    

sample_input <- 'AAAAAAAAACGTAA'
start_sequence <- 'ACG'

print(sync(sample_input, start_sequence, FALSE))

